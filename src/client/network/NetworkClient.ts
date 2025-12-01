import { Client, Room } from "colyseus.js";
import { CONFIG, getServerUrl } from "../config";

// Re-export types from schema for convenience
export interface PlayerState {
  sessionId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  hasDisc: boolean;
  score: number;
}

export interface DiscState {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  state: "held" | "threat" | "inert";
  threatTimeRemaining: number;
  threatTimeMax: number;
}

export interface RoomState {
  players: Map<string, PlayerState>;
  discs: Map<string, DiscState>;
  arenaWidth: number;
  arenaHeight: number;
  wallThickness: number;
}

export type NetworkEventCallback = (data: unknown) => void;

export class NetworkClient {
  public client: Client;
  public room: Room | null = null;
  public sessionId: string = "";
  public connected: boolean = false;

  // Expose state for direct access
  public players: Map<string, PlayerState> = new Map();
  public discs: Map<string, DiscState> = new Map();
  public arenaWidth: number = 800;
  public arenaHeight: number = 600;
  public wallThickness: number = 10;

  // Event callbacks - assign these to handle events
  public onConnected: (() => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onPlayerJoin: ((player: PlayerState) => void) | null = null;
  public onPlayerLeave: ((sessionId: string) => void) | null = null;
  public onPlayerUpdate: ((player: PlayerState) => void) | null = null;
  public onDiscUpdate: ((disc: DiscState) => void) | null = null;
  public onPlayerHit: ((data: { hitPlayerId: string; byPlayerId: string }) => void) | null = null;
  public onStateChange: (() => void) | null = null;

  constructor() {
    this.client = new Client(getServerUrl());
  }

  async connect(roomName: string = "game"): Promise<void> {
    try {
      this.room = await this.client.joinOrCreate(roomName);
      this.sessionId = this.room.sessionId;
      this.connected = true;

      if (CONFIG.debug.logNetworkMessages) {
        console.log(`Connected to room ${roomName} as ${this.sessionId}`);
      }

      this.setupRoomListeners();
      this.onConnected?.();
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }
  }

  private setupRoomListeners(): void {
    if (!this.room) return;

    // Listen to state changes
    this.room.onStateChange((state) => {
      // Update arena dimensions
      this.arenaWidth = state.arenaWidth;
      this.arenaHeight = state.arenaHeight;
      this.wallThickness = state.wallThickness;

      this.onStateChange?.();
    });

    // Player added
    this.room.state.players.onAdd((player: PlayerState, sessionId: string) => {
      if (CONFIG.debug.logNetworkMessages) {
        console.log(`Player joined: ${sessionId}`);
      }
      this.players.set(sessionId, player);
      this.onPlayerJoin?.(player);

      // Listen to player changes
      (player as any).onChange(() => {
        this.onPlayerUpdate?.(player);
      });
    });

    // Player removed
    this.room.state.players.onRemove((_player: PlayerState, sessionId: string) => {
      if (CONFIG.debug.logNetworkMessages) {
        console.log(`Player left: ${sessionId}`);
      }
      this.players.delete(sessionId);
      this.onPlayerLeave?.(sessionId);
    });

    // Disc added
    this.room.state.discs.onAdd((disc: DiscState, discId: string) => {
      if (CONFIG.debug.logNetworkMessages) {
        console.log(`Disc added: ${discId}`);
      }
      this.discs.set(discId, disc);

      // Listen to disc changes
      (disc as any).onChange(() => {
        this.onDiscUpdate?.(disc);
      });
    });

    // Disc removed
    this.room.state.discs.onRemove((_disc: DiscState, discId: string) => {
      this.discs.delete(discId);
    });

    // Custom messages
    this.room.onMessage("playerHit", (data) => {
      if (CONFIG.debug.logNetworkMessages) {
        console.log("Player hit:", data);
      }
      this.onPlayerHit?.(data);
    });

    // Handle disconnect
    this.room.onLeave((code) => {
      if (CONFIG.debug.logNetworkMessages) {
        console.log(`Disconnected with code: ${code}`);
      }
      this.connected = false;
      this.onDisconnected?.();
    });
  }

  // Send player input to server
  sendInput(x: number, y: number): void {
    if (!this.room || !this.connected) return;
    this.room.send("input", { x, y });
  }

  // Send throw command to server
  sendThrow(targetX: number, targetY: number): void {
    if (!this.room || !this.connected) return;
    this.room.send("throw", { targetX, targetY });
  }

  // Check if this session is the local player
  isLocalPlayer(sessionId: string): boolean {
    return sessionId === this.sessionId;
  }

  // Get local player state
  getLocalPlayer(): PlayerState | undefined {
    return this.players.get(this.sessionId);
  }

  disconnect(): void {
    this.room?.leave();
    this.connected = false;
  }
}
