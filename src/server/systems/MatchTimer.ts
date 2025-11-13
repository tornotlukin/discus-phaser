import { RoomState } from '../../shared/schemas/RoomState';
import { EventBus, GameEvents } from '../utils/EventBus';

/**
 * Match timer system
 *
 * Handles:
 * - Match countdown timer
 * - Match state transitions
 * - Overtime/sudden death
 */

export class MatchTimer {
  private eventBus: EventBus;
  private lastTickTime: number = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Update timer (called every tick)
   */
  update(state: RoomState, currentTime: number): void {
    // Skip if not playing
    if (state.matchState !== 'playing' && state.matchState !== 'overtime') {
      return;
    }

    // Initialize last tick time
    if (this.lastTickTime === 0) {
      this.lastTickTime = currentTime;
      return;
    }

    // Calculate elapsed time since last tick
    const deltaSeconds = (currentTime - this.lastTickTime) / 1000;
    this.lastTickTime = currentTime;

    // Countdown
    state.matchTime -= deltaSeconds;

    // Check if time ran out
    if (state.matchTime <= 0) {
      state.matchTime = 0;

      // Check for overtime
      if (state.matchState === 'playing' && state.suddenDeathEnabled) {
        this.startOvertime(state);
      }
    }
  }

  /**
   * Start match
   */
  startMatch(state: RoomState): void {
    state.matchState = 'playing';
    state.matchTime = state.matchDuration;
    this.lastTickTime = Date.now();

    this.eventBus.emit(GameEvents.MATCH_START, {
      matchDuration: state.matchDuration
    });
  }

  /**
   * Start overtime/sudden death
   */
  private startOvertime(state: RoomState): void {
    state.matchState = 'overtime';
    state.matchTime = 60; // 60 seconds of overtime

    this.eventBus.emit(GameEvents.OVERTIME_START, {
      overtimeDuration: 60
    });
  }

  /**
   * End match
   */
  endMatch(state: RoomState, winningTeam?: string, reason?: string): void {
    state.matchState = 'ended';
    state.matchTime = 0;

    this.eventBus.emit(GameEvents.MATCH_END, {
      winningTeam,
      reason,
      finalScores: Array.from(state.teamScores.entries())
    });
  }

  /**
   * Pause match
   */
  pauseMatch(state: RoomState): void {
    if (state.matchState === 'playing' || state.matchState === 'overtime') {
      this.lastTickTime = 0; // Reset to pause
    }
  }

  /**
   * Resume match
   */
  resumeMatch(state: RoomState): void {
    this.lastTickTime = Date.now();
  }

  /**
   * Get formatted time string
   */
  getFormattedTime(state: RoomState): string {
    const minutes = Math.floor(state.matchTime / 60);
    const seconds = Math.floor(state.matchTime % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
