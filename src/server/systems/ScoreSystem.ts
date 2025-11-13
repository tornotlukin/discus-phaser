import { RoomState } from '../../shared/schemas/RoomState';
import { PlayerSchema } from '../../shared/schemas/PlayerSchema';
import { EventBus, GameEvents } from '../utils/EventBus';

/**
 * Score tracking system
 *
 * Handles:
 * - Player disintegrations
 * - Team score updates
 * - Win condition checking
 * - Mercy rule detection
 */

export class ScoreSystem {
  private eventBus: EventBus;
  private disintegrationPoints: number = 1;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    // Listen for player disintegrations
    this.eventBus.on(GameEvents.PLAYER_DISINTEGRATED, (data) => {
      this.handlePlayerDisintegration(data);
    });
  }

  /**
   * Handle player disintegration
   */
  private handlePlayerDisintegration(data: {
    playerId: string;
    killerTeam: string;
    state: RoomState;
  }): void {
    const { killerTeam, state } = data;

    // Award points to killer's team
    const currentScore = state.teamScores.get(killerTeam) || 0;
    state.teamScores.set(killerTeam, currentScore + this.disintegrationPoints);

    this.eventBus.emit(GameEvents.SCORE_UPDATED, {
      teamId: killerTeam,
      newScore: currentScore + this.disintegrationPoints
    });
  }

  /**
   * Process discus hit on player
   */
  processHit(
    victim: PlayerSchema,
    attackerTeam: string,
    state: RoomState
  ): void {
    // Don't process if victim is already disintegrated
    if (victim.state === 'disintegrated') return;

    // Check if blocking or dodging
    if (victim.state === 'blocking') {
      // TODO: Handle block mechanics
      return;
    }

    if (victim.state === 'dodging') {
      // TODO: Handle dodge mechanics
      return;
    }

    // Disintegrate player
    victim.state = 'disintegrated';
    victim.velocityX = 0;
    victim.velocityY = 0;

    // Emit disintegration event
    this.eventBus.emit(GameEvents.PLAYER_DISINTEGRATED, {
      playerId: victim.sessionId,
      killerTeam: attackerTeam,
      state: state
    });

    // TODO: Schedule respawn
  }

  /**
   * Check win conditions
   */
  checkWinConditions(state: RoomState): {
    hasWinner: boolean;
    winningTeam?: string;
    reason?: string;
  } {
    // Check mercy rule
    if (state.isMercyRule()) {
      const leadingTeam = state.getLeadingTeam();
      if (leadingTeam) {
        this.eventBus.emit(GameEvents.MERCY_RULE_TRIGGERED, {
          winningTeam: leadingTeam
        });

        return {
          hasWinner: true,
          winningTeam: leadingTeam,
          reason: 'mercy_rule'
        };
      }
    }

    // Check if time ran out
    if (state.matchTime <= 0 && state.matchState === 'playing') {
      const leadingTeam = state.getLeadingTeam();

      // Check for tie
      const scores = Array.from(state.teamScores.values());
      const maxScore = Math.max(...scores);
      const tiedTeams = Array.from(state.teamScores.entries())
        .filter(([_, score]) => score === maxScore)
        .map(([teamId, _]) => teamId);

      if (tiedTeams.length > 1) {
        // Tie - go to overtime if enabled
        if (state.suddenDeathEnabled) {
          return { hasWinner: false };
        } else {
          return {
            hasWinner: true,
            winningTeam: tiedTeams[0], // First tied team
            reason: 'tie'
          };
        }
      }

      if (leadingTeam) {
        return {
          hasWinner: true,
          winningTeam: leadingTeam,
          reason: 'time_up'
        };
      }
    }

    return { hasWinner: false };
  }

  /**
   * Get team scores sorted by rank
   */
  getLeaderboard(state: RoomState): Array<{ teamId: string; score: number }> {
    const leaderboard: Array<{ teamId: string; score: number }> = [];

    state.teamScores.forEach((score, teamId) => {
      leaderboard.push({ teamId, score });
    });

    leaderboard.sort((a, b) => b.score - a.score);

    return leaderboard;
  }

  /**
   * Reset scores
   */
  resetScores(state: RoomState): void {
    state.teamScores.forEach((_, teamId) => {
      state.teamScores.set(teamId, 0);
    });
  }
}
