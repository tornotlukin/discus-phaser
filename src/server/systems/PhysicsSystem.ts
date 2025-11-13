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

      // Clamp to arena bounds
      const radius = this.config.playerRadius;
      player.x = this.clamp(player.x, radius, this.config.arenaWidth - radius);
      player.y = this.clamp(player.y, radius, this.config.arenaHeight - radius);

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

      // Bounce off arena walls
      const radius = this.config.discusRadius;
      if (discus.x - radius < 0 || discus.x + radius > this.config.arenaWidth) {
        discus.velocityX *= -1;
        discus.x = this.clamp(discus.x, radius, this.config.arenaWidth - radius);
      }
      if (discus.y - radius < 0 || discus.y + radius > this.config.arenaHeight) {
        discus.velocityY *= -1;
        discus.y = this.clamp(discus.y, radius, this.config.arenaHeight - radius);
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
