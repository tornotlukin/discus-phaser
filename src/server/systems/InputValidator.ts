import { EventBus, GameEvents } from '../utils/EventBus';

/**
 * Input validation system
 *
 * Validates all client inputs to prevent cheating
 * - Range validation
 * - Timestamp sanity checks
 * - Rate limiting
 * - Sequence number validation
 */

export interface PlayerInput {
  sequenceNumber: number;
  timestamp: number;
  moveX: number;
  moveY: number;
  throwing: boolean;
  blocking: boolean;
  dodging: boolean;
}

export class InputValidator {
  private eventBus: EventBus;
  private lastInputTime: Map<string, number> = new Map();
  private inputRateLimit: number = 10; // Minimum ms between inputs

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Validate player input
   */
  validate(sessionId: string, input: PlayerInput): boolean {
    // Check input structure
    if (!this.isValidStructure(input)) {
      this.eventBus.emit(GameEvents.INVALID_INPUT, {
        sessionId,
        reason: 'Invalid input structure'
      });
      return false;
    }

    // Check movement values are in valid range
    if (!this.isValidMovement(input.moveX, input.moveY)) {
      this.eventBus.emit(GameEvents.INVALID_INPUT, {
        sessionId,
        reason: 'Invalid movement values'
      });
      return false;
    }

    // Check timestamp sanity
    if (!this.isValidTimestamp(input.timestamp)) {
      this.eventBus.emit(GameEvents.INVALID_INPUT, {
        sessionId,
        reason: 'Invalid timestamp'
      });
      return false;
    }

    // Check rate limiting
    if (!this.checkRateLimit(sessionId)) {
      this.eventBus.emit(GameEvents.INVALID_INPUT, {
        sessionId,
        reason: 'Rate limit exceeded'
      });
      return false;
    }

    // Update last input time
    this.lastInputTime.set(sessionId, Date.now());

    return true;
  }

  /**
   * Check if input has valid structure
   */
  private isValidStructure(input: any): input is PlayerInput {
    return (
      typeof input === 'object' &&
      typeof input.sequenceNumber === 'number' &&
      typeof input.timestamp === 'number' &&
      typeof input.moveX === 'number' &&
      typeof input.moveY === 'number' &&
      typeof input.throwing === 'boolean' &&
      typeof input.blocking === 'boolean' &&
      typeof input.dodging === 'boolean'
    );
  }

  /**
   * Check if movement values are valid (-1 to 1 range)
   */
  private isValidMovement(moveX: number, moveY: number): boolean {
    return (
      Math.abs(moveX) <= 1 &&
      Math.abs(moveY) <= 1 &&
      !isNaN(moveX) &&
      !isNaN(moveY)
    );
  }

  /**
   * Check if timestamp is reasonable (within 5 seconds of server time)
   */
  private isValidTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    return diff < 5000; // 5 second tolerance
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(sessionId: string): boolean {
    const lastTime = this.lastInputTime.get(sessionId);
    if (!lastTime) return true;

    const now = Date.now();
    const elapsed = now - lastTime;

    return elapsed >= this.inputRateLimit;
  }

  /**
   * Normalize movement vector
   * Prevents diagonal movement exploits
   */
  normalizeMovement(moveX: number, moveY: number): { x: number; y: number } {
    const length = Math.sqrt(moveX * moveX + moveY * moveY);

    if (length === 0) {
      return { x: 0, y: 0 };
    }

    if (length > 1) {
      return {
        x: moveX / length,
        y: moveY / length
      };
    }

    return { x: moveX, y: moveY };
  }

  /**
   * Clean up player data on disconnect
   */
  cleanup(sessionId: string): void {
    this.lastInputTime.delete(sessionId);
  }
}
