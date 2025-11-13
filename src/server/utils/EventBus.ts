/**
 * EventBus for inter-system communication
 *
 * Allows systems to communicate without tight coupling
 * Following event-driven architecture pattern
 */

export type EventHandler = (data?: any) => void;

export class EventBus {
  private events: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventName: string, handler: EventHandler): void {
    const handlers = this.events.get(eventName);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  emit(eventName: string, data?: any): void {
    const handlers = this.events.get(eventName);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for '${eventName}':`, error);
      }
    });
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * Get event names for debugging
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

/**
 * Common game events
 */
export const GameEvents = {
  // Collision events
  DISCUS_HIT_PLAYER: 'discus:hit:player',
  PLAYER_HIT_HAZARD: 'player:hit:hazard',
  DISCUS_HIT_WALL: 'discus:hit:wall',

  // Score events
  PLAYER_DISINTEGRATED: 'player:disintegrated',
  SCORE_UPDATED: 'score:updated',
  MERCY_RULE_TRIGGERED: 'mercy:triggered',

  // Match events
  MATCH_START: 'match:start',
  MATCH_END: 'match:end',
  OVERTIME_START: 'overtime:start',

  // Player events
  PLAYER_READY: 'player:ready',
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',

  // Input events
  INVALID_INPUT: 'input:invalid',
  INPUT_PROCESSED: 'input:processed'
} as const;
