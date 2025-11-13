import { Schema, MapSchema, type } from '@colyseus/schema';
import { PlayerSchema } from './PlayerSchema';
import { DiscusSchema } from './DiscusSchema';

/**
 * Root room state schema
 *
 * This is the authoritative game state synchronized to all clients
 * Following Gabriel Gambetta's architecture for authoritative server
 */
export class RoomState extends Schema {
  @type({ map: PlayerSchema })
  players = new MapSchema<PlayerSchema>();

  @type({ map: DiscusSchema })
  discuses = new MapSchema<DiscusSchema>();

  @type({ map: 'number' })
  teamScores = new MapSchema<number>();

  @type('number')
  matchTime: number = 180; // Countdown timer in seconds

  @type('string')
  matchState: string = 'waiting'; // 'waiting' | 'playing' | 'overtime' | 'ended'

  @type('number')
  serverTimestamp: number = 0; // For client interpolation

  @type('string')
  roomName: string = 'Game Room';

  @type('number')
  tickNumber: number = 0; // Current tick number for debugging

  /**
   * Custom room settings (player-configurable)
   */
  @type('number')
  matchDuration: number = 180;

  @type('number')
  mercyRuleThreshold: number = 10;

  @type('boolean')
  suddenDeathEnabled: boolean = true;

  /**
   * Initialize team scores
   */
  initializeTeams(teamIds: string[]) {
    teamIds.forEach(teamId => {
      this.teamScores.set(teamId, 0);
    });
  }

  /**
   * Get team with highest score
   */
  getLeadingTeam(): string | null {
    let leadingTeam: string | null = null;
    let highestScore = -1;

    this.teamScores.forEach((score, teamId) => {
      if (score > highestScore) {
        highestScore = score;
        leadingTeam = teamId;
      }
    });

    return leadingTeam;
  }

  /**
   * Check if mercy rule applies
   */
  isMercyRule(): boolean {
    const scores = Array.from(this.teamScores.values());
    if (scores.length < 2) return false;

    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    return (maxScore - minScore) >= this.mercyRuleThreshold;
  }
}
