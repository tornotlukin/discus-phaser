import { Schema, type } from '@colyseus/schema';

/**
 * Player state schema
 *
 * Synchronized from server to all clients
 * Contains authoritative player state
 */
export class PlayerSchema extends Schema {
  @type('string')
  sessionId: string = '';

  @type('number')
  x: number = 0;

  @type('number')
  y: number = 0;

  @type('number')
  velocityX: number = 0;

  @type('number')
  velocityY: number = 0;

  @type('number')
  angle: number = 0; // Movement angle in radians

  @type('string')
  state: string = 'idle'; // 'idle' | 'moving' | 'blocking' | 'dodging' | 'disintegrated' | 'disrupted'

  @type('boolean')
  hasDiscus: boolean = false;

  @type('string')
  teamId: string = '';

  @type('number')
  score: number = 0;

  @type('number')
  lastInputSequence: number = 0; // For client reconciliation

  @type('boolean')
  isReady: boolean = false; // For lobby ready-up

  @type('string')
  name: string = 'Player';

  // Server-side only (not synced)
  radius: number = 16;
  disconnectTimeout?: NodeJS.Timeout;
  lastInputTime: number = 0;
}
