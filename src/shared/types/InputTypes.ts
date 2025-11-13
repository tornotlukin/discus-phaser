/**
 * Input message types
 *
 * Shared between client and server for type safety
 */

/**
 * Player input message sent from client to server
 */
export interface PlayerInput {
  sequenceNumber: number;
  timestamp: number;
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  throwing: boolean;
  blocking: boolean;
  dodging: boolean;
}

/**
 * Input acknowledgment sent from server to client
 */
export interface InputAck {
  sequenceNumber: number;
  timestamp: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

/**
 * State snapshot sent from server to client
 */
export interface StateSnapshot {
  timestamp: number;
  players: {
    [sessionId: string]: {
      position: { x: number; y: number };
      velocity: { x: number; y: number };
      state: string;
      hasDiscus: boolean;
    };
  };
  discuses: {
    [discusId: string]: {
      position: { x: number; y: number };
      velocity: { x: number; y: number };
      state: string;
      ownerId: string;
    };
  };
  score: { [teamId: string]: number };
  matchTime: number;
}
