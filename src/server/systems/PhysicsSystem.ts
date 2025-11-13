import { MapSchema } from '@colyseus/schema';
import { PlayerSchema } from '../../shared/schemas/PlayerSchema';
import { DiscusSchema } from '../../shared/schemas/DiscusSchema';
import { EventBus } from '../utils/EventBus';

/**
 * Authoritative physics system
 *
 * Handles:
 * - Player movement based on validated inputs
 * - Discus movement and trajectories
 * - Friction and acceleration
 * - Arena bounds clamping
 *
 * Running at 60 Hz on server
 */

export interface PhysicsConfig {
  playerSpeed: number;
  playerAcceleration: number;
  playerFriction: number;
  playerRadius: number;
  discusSpeed: number;
  discusRadius: number;
  arenaWidth: number;
  arenaHeight: number;
  borderWidth: number;
}

export class PhysicsSystem {
  private eventBus: EventBus;
  private config: PhysicsConfig;

  constructor(eventBus: EventBus, config: PhysicsConfig) {
    this.eventBus = eventBus;
    this.config = config;
  }

  /**
   * Update all physics (called every tick)
   */
  update(
    players: MapSchema<PlayerSchema>,
    discuses: MapSchema<DiscusSchema>,
    deltaTime: number
  ): void {
    this.updatePlayers(players, deltaTime);
    this.updateDiscuses(discuses, deltaTime);
  }

  /**
   * Apply input to player
   */
  applyPlayerInput(
    player: PlayerSchema,
    moveX: number,
    moveY: number,
    deltaTime: number
  ): void {
    // Normalize diagonal movement
    let length = Math.sqrt(moveX * moveX + moveY * moveY);
    if (length > 1) {
      moveX /= length;
      moveY /= length;
    }

    // Calculate target velocity
    const targetVelX = moveX * this.config.playerSpeed;
    const targetVelY = moveY * this.config.playerSpeed;

    // Apply acceleration
    const accel = this.config.playerAcceleration * deltaTime;
    player.velocityX = this.approach(player.velocityX, targetVelX, accel);
    player.velocityY = this.approach(player.velocityY, targetVelY, accel);

    // Calculate movement angle
    if (player.velocityX !== 0 || player.velocityY !== 0) {
      player.angle = Math.atan2(player.velocityY, player.velocityX);
    }
  }

  /**
   * Update all players
   */
  private updatePlayers(
    players: MapSchema<PlayerSchema>,
    deltaTime: number
  ): void {
    players.forEach((player) => {
      // Skip disintegrated or disrupted players
      if (player.state === 'disintegrated' || player.state === 'disrupted') {
        return;
      }

      // Apply friction
      const friction = this.config.playerFriction * deltaTime;
      player.velocityX = this.approach(player.velocityX, 0, friction);
      player.velocityY = this.approach(player.velocityY, 0, friction);

      // Update position
      player.x += player.velocityX * deltaTime;
      player.y += player.velocityY * deltaTime;

      // Clamp to arena bounds (accounting for border)
      const radius = this.config.playerRadius;
      const border = this.config.borderWidth;
      const minX = border + radius;
      const maxX = this.config.arenaWidth - border - radius;
      const minY = border + radius;
      const maxY = this.config.arenaHeight - border - radius;

      player.x = this.clamp(player.x, minX, maxX);
      player.y = this.clamp(player.y, minY, maxY);

      // Update state based on velocity
      if (Math.abs(player.velocityX) < 1 && Math.abs(player.velocityY) < 1) {
        if (player.state === 'moving') {
          player.state = 'idle';
        }
      } else {
        if (player.state === 'idle') {
          player.state = 'moving';
        }
      }
    });

    // Resolve player-player collisions
    this.resolvePlayerCollisions(players);
  }

  /**
   * Resolve player-player collisions
   * Pushes overlapping players apart
   */
  private resolvePlayerCollisions(players: MapSchema<PlayerSchema>): void {
    const playerArray = Array.from(players.values());

    // Check all pairs of players
    for (let i = 0; i < playerArray.length; i++) {
      const player1 = playerArray[i];

      // Skip inactive players
      if (player1.state === 'disintegrated' || player1.state === 'disrupted') {
        continue;
      }

      for (let j = i + 1; j < playerArray.length; j++) {
        const player2 = playerArray[j];

        // Skip inactive players
        if (player2.state === 'disintegrated' || player2.state === 'disrupted') {
          continue;
        }

        // Check for collision
        const dx = player2.x - player1.x;
        const dy = player2.y - player1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.config.playerRadius * 2;

        if (distance < minDistance && distance > 0) {
          // Calculate overlap
          const overlap = minDistance - distance;

          // Calculate push direction (normalized)
          const pushX = (dx / distance) * overlap * 0.5;
          const pushY = (dy / distance) * overlap * 0.5;

          // Push players apart
          player1.x -= pushX;
          player1.y -= pushY;
          player2.x += pushX;
          player2.y += pushY;

          // Also dampen their velocities to prevent jitter
          player1.velocityX *= 0.5;
          player1.velocityY *= 0.5;
          player2.velocityX *= 0.5;
          player2.velocityY *= 0.5;
        }
      }
    }
  }

  /**
   * Update all discuses
   */
  private updateDiscuses(
    discuses: MapSchema<DiscusSchema>,
    deltaTime: number
  ): void {
    const now = Date.now();

    discuses.forEach((discus) => {
      // Update position
      discus.x += discus.velocityX * deltaTime;
      discus.y += discus.velocityY * deltaTime;

      // Check threat duration
      if (discus.state === 'threat' && now >= discus.threatEndsAt) {
        discus.state = 'inert';
        // Slow down when becoming inert
        discus.velocityX *= 0.5;
        discus.velocityY *= 0.5;
      }

      // Bounce off arena walls (accounting for border)
      const radius = this.config.discusRadius;
      const border = this.config.borderWidth;
      const minX = border + radius;
      const maxX = this.config.arenaWidth - border - radius;
      const minY = border + radius;
      const maxY = this.config.arenaHeight - border - radius;

      if (discus.x < minX || discus.x > maxX) {
        discus.velocityX *= -1;
        discus.x = this.clamp(discus.x, minX, maxX);
      }
      if (discus.y < minY || discus.y > maxY) {
        discus.velocityY *= -1;
        discus.y = this.clamp(discus.y, minY, maxY);
      }
    });
  }

  /**
   * Throw discus from player
   */
  throwDiscus(player: PlayerSchema, targetX: number, targetY: number): DiscusSchema {
    const discus = new DiscusSchema();
    discus.id = `discus_${player.sessionId}_${Date.now()}`;
    discus.x = player.x;
    discus.y = player.y;

    // Calculate throw direction
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      discus.velocityX = (dx / length) * this.config.discusSpeed;
      discus.velocityY = (dy / length) * this.config.discusSpeed;
    }

    discus.state = 'threat';
    discus.ownerId = player.sessionId;
    discus.createdAt = Date.now();
    discus.threatEndsAt = Date.now() + 3000; // 3 second threat duration

    return discus;
  }

  /**
   * Approach value toward target
   */
  private approach(current: number, target: number, amount: number): number {
    if (current < target) {
      return Math.min(current + amount, target);
    } else {
      return Math.max(current - amount, target);
    }
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
