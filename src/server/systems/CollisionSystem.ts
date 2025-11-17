import { MapSchema } from '@colyseus/schema';
import { PlayerSchema } from '../../shared/schemas/PlayerSchema';
import { DiscusSchema } from '../../shared/schemas/DiscusSchema';
import { EventBus, GameEvents } from '../utils/EventBus';

/**
 * Collision detection system
 *
 * Authoritative collision detection on server
 * No client-side hit detection (prevents cheating)
 *
 * Detects:
 * - Discus vs Player collisions
 * - Player vs Hazard collisions (future)
 */

export interface CollisionEvent {
  type: string;
  timestamp: number;
  data: any;
}

export class CollisionSystem {
  private eventBus: EventBus;
  private playerWidth: number;
  private playerHeight: number;
  private discusRadius: number;

  constructor(eventBus: EventBus, playerWidth: number, playerHeight: number, discusRadius: number) {
    this.eventBus = eventBus;
    this.playerWidth = playerWidth;
    this.playerHeight = playerHeight;
    this.discusRadius = discusRadius;
  }

  /**
   * Check all collisions
   */
  update(
    players: MapSchema<PlayerSchema>,
    discuses: MapSchema<DiscusSchema>
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    // Check discus-player collisions
    discuses.forEach((discus) => {
      // Only threat discuses can hit players
      if (discus.state !== 'threat') return;

      players.forEach((player) => {
        // Skip disintegrated or disrupted players
        if (player.state === 'disintegrated' || player.state === 'disrupted') {
          return;
        }

        // Skip owner (can't hit yourself immediately)
        if (player.sessionId === discus.ownerId) {
          // TODO: Add grace period before discus can return to owner
          return;
        }

        // Check circle-rectangle collision (discus vs player)
        if (this.checkCircleRectangleCollision(
          discus.x, discus.y, this.discusRadius,
          player.x, player.y, this.playerWidth, this.playerHeight
        )) {
          const event: CollisionEvent = {
            type: GameEvents.DISCUS_HIT_PLAYER,
            timestamp: Date.now(),
            data: {
              playerId: player.sessionId,
              discusId: discus.id,
              discusOwnerId: discus.ownerId,
              playerTeam: player.teamId
            }
          };

          events.push(event);
          this.eventBus.emit(GameEvents.DISCUS_HIT_PLAYER, event.data);
        }
      });
    });

    return events;
  }

  /**
   * Circle-rectangle collision detection
   * Circle is the discus, rectangle is the player
   */
  private checkCircleRectangleCollision(
    circleX: number, circleY: number, radius: number,
    rectX: number, rectY: number, rectWidth: number, rectHeight: number
  ): boolean {
    // Find the closest point on the rectangle to the circle
    const halfWidth = rectWidth / 2;
    const halfHeight = rectHeight / 2;

    const closestX = Math.max(rectX - halfWidth, Math.min(circleX, rectX + halfWidth));
    const closestY = Math.max(rectY - halfHeight, Math.min(circleY, rectY + halfHeight));

    // Calculate distance from closest point to circle center
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared < (radius * radius);
  }

  /**
   * Point in circle collision
   */
  checkPointInCircle(
    pointX: number, pointY: number,
    circleX: number, circleY: number, radius: number
  ): boolean {
    const dx = pointX - circleX;
    const dy = pointY - circleY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared < (radius * radius);
  }

  /**
   * Get distance between two points
   */
  getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Update collision dimensions
   */
  updateDimensions(playerWidth: number, playerHeight: number, discusRadius: number): void {
    this.playerWidth = playerWidth;
    this.playerHeight = playerHeight;
    this.discusRadius = discusRadius;
  }
}
