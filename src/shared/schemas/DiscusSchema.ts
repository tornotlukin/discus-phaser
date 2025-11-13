import { Schema, type } from '@colyseus/schema';

/**
 * Discus state schema
 *
 * Synchronized from server to all clients
 * Contains authoritative discus state
 */
export class DiscusSchema extends Schema {
  @type('string')
  id: string = '';

  @type('number')
  x: number = 0;

  @type('number')
  y: number = 0;

  @type('number')
  velocityX: number = 0;

  @type('number')
  velocityY: number = 0;

  @type('string')
  state: string = 'threat'; // 'threat' | 'inert' | 'returning'

  @type('string')
  ownerId: string = ''; // Session ID of owner

  @type('number')
  createdAt: number = 0; // Timestamp

  @type('number')
  threatEndsAt: number = 0; // When discus becomes inert

  // Server-side only (not synced)
  radius: number = 8;
}
