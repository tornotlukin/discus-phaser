import { Room, Client } from 'colyseus';
import { RoomState } from '../../shared/schemas/RoomState';
import { PlayerSchema } from '../../shared/schemas/PlayerSchema';
import { EventBus, GameEvents } from '../utils/EventBus';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { MatchTimer } from '../systems/MatchTimer';
import { InputValidator, PlayerInput } from '../systems/InputValidator';

/**
 * GameRoom
 *
 * Main gameplay room following Gabriel Gambetta's authoritative server architecture
 *
 * Architecture:
 * - 60 Hz physics simulation
 * - 20 Hz state broadcast
 * - Queue + Batch input processing
 * - Client-side prediction with server reconciliation
 * - Separate systems for concerns (Physics, Collision, Score, etc.)
 */

interface QueuedInput {
  client: Client;
  input: PlayerInput;
}

export class GameRoom extends Room<RoomState> {
  // Configuration
  maxClients = 16;
  private TICK_RATE = 60; // Hz
  private SNAPSHOT_RATE = 20; // Hz
  private DISCONNECT_TIMEOUT = 30000; // ms (30 seconds)

  // Intervals
  private tickInterval!: NodeJS.Timeout;
  private snapshotInterval!: NodeJS.Timeout;

  // Systems
  private eventBus!: EventBus;
  private physicsSystem!: PhysicsSystem;
  private collisionSystem!: CollisionSystem;
  private scoreSystem!: ScoreSystem;
  private matchTimer!: MatchTimer;
  private inputValidator!: InputValidator;

  // Input queue (for batch processing)
  private inputQueue: QueuedInput[] = [];

  // Timing
  private lastTickTime = 0;
  private tickNumber = 0;

  /**
   * Room creation
   */
  onCreate(options: any) {
    console.log(`GameRoom created: ${this.roomId}`);

    // Initialize state
    this.setState(new RoomState());

    // Apply custom settings from room creator
    if (options.customSettings) {
      this.state.matchDuration = options.customSettings.matchDuration || 180;
      this.state.mercyRuleThreshold = options.customSettings.mercyRuleThreshold || 10;
      this.state.suddenDeathEnabled = options.customSettings.suddenDeathEnabled !== undefined
        ? options.customSettings.suddenDeathEnabled
        : true;
    }

    // Set room metadata
    this.state.roomName = options.name || 'Game Room';
    this.setMetadata({
      name: this.state.roomName,
      matchState: this.state.matchState,
      customSettings: {
        matchDuration: this.state.matchDuration,
        mercyRuleThreshold: this.state.mercyRuleThreshold,
        suddenDeathEnabled: this.state.suddenDeathEnabled
      }
    });

    // Set max clients
    if (options.maxPlayers) {
      this.maxClients = options.maxPlayers;
    }

    // Initialize event bus
    this.eventBus = new EventBus();

    // Initialize systems
    this.physicsSystem = new PhysicsSystem(this.eventBus, {
      playerSpeed: 200,
      playerAcceleration: 800,
      playerFriction: 600,
      playerRadius: 16,
      discusSpeed: 400,
      discusRadius: 8,
      arenaWidth: 1920,
      arenaHeight: 1080
    });

    this.collisionSystem = new CollisionSystem(this.eventBus, 16, 8);
    this.scoreSystem = new ScoreSystem(this.eventBus);
    this.matchTimer = new MatchTimer(this.eventBus);
    this.inputValidator = new InputValidator(this.eventBus);

    // Set up event listeners
    this.setupEventListeners();

    // Setup message handlers
    this.setupMessageHandlers();

    // Start tick loop (60 Hz)
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / this.TICK_RATE);

    // Start snapshot broadcast (20 Hz)
    this.snapshotInterval = setInterval(() => {
      this.broadcastSnapshot();
    }, 1000 / this.SNAPSHOT_RATE);

    // Initialize teams (8 teams for now)
    const teamIds = ['team1', 'team2', 'team3', 'team4', 'team5', 'team6', 'team7', 'team8'];
    this.state.initializeTeams(teamIds);

    console.log(`  Tick Rate: ${this.TICK_RATE} Hz`);
    console.log(`  Snapshot Rate: ${this.SNAPSHOT_RATE} Hz`);
    console.log(`  Max Players: ${this.maxClients}`);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    // Listen for collision events
    this.eventBus.on(GameEvents.DISCUS_HIT_PLAYER, (data) => {
      const player = this.state.players.get(data.playerId);
      if (!player) return;

      // Get attacker's team
      const discus = this.state.discuses.get(data.discusId);
      if (!discus) return;

      const attacker = this.state.players.get(discus.ownerId);
      if (!attacker) return;

      // Process hit
      this.scoreSystem.processHit(player, attacker.teamId, this.state);

      // Remove discus after hit
      this.state.discuses.delete(data.discusId);
    });

    // Listen for match end
    this.eventBus.on(GameEvents.MATCH_END, (data) => {
      console.log(`Match ended: ${data.reason}, Winner: ${data.winningTeam}`);
    });
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers() {
    // Input message (queue for batch processing)
    this.onMessage('input', (client, message: PlayerInput) => {
      this.inputQueue.push({ client, input: message });
    });

    // Ready message (lobby)
    this.onMessage('ready', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = message.ready;
        this.checkAllReady();
      }
    });

    // Team select message
    this.onMessage('selectTeam', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.matchState === 'waiting') {
        player.teamId = message.teamId;
      }
    });

    // Ping/pong for latency measurement
    this.onMessage('ping', (client, message) => {
      client.send('pong', { timestamp: message.timestamp });
    });
  }

  /**
   * Main tick loop (60 Hz)
   *
   * Following Gabriel Gambetta's architecture:
   * 1. Process all queued inputs
   * 2. Update physics
   * 3. Check collisions
   * 4. Update timer
   * 5. Check win conditions
   */
  private tick() {
    const now = Date.now();
    const deltaTime = (now - this.lastTickTime) / 1000; // Convert to seconds
    this.lastTickTime = now;
    this.tickNumber++;

    // Update tick number in state
    this.state.tickNumber = this.tickNumber;

    // Process all queued inputs (batch processing)
    this.processInputQueue(deltaTime);

    // Update physics
    this.physicsSystem.update(this.state.players, this.state.discuses, deltaTime);

    // Check collisions
    this.collisionSystem.update(this.state.players, this.state.discuses);

    // Update match timer
    this.matchTimer.update(this.state, now);

    // Check win conditions
    if (this.state.matchState === 'playing' || this.state.matchState === 'overtime') {
      const result = this.scoreSystem.checkWinConditions(this.state);
      if (result.hasWinner) {
        this.matchTimer.endMatch(this.state, result.winningTeam, result.reason);
      }
    }
  }

  /**
   * Process queued inputs (batch processing)
   */
  private processInputQueue(deltaTime: number) {
    while (this.inputQueue.length > 0) {
      const { client, input } = this.inputQueue.shift()!;
      const player = this.state.players.get(client.sessionId);

      if (!player) continue;
      if (this.state.matchState !== 'playing' && this.state.matchState !== 'overtime') continue;

      // Validate input
      if (!this.inputValidator.validate(client.sessionId, input)) {
        continue;
      }

      // Apply input to physics
      this.physicsSystem.applyPlayerInput(player, input.moveX, input.moveY, deltaTime);

      // Update last input sequence
      player.lastInputSequence = input.sequenceNumber;

      // Handle actions
      if (input.throwing && player.hasDiscus) {
        // Throw discus in the direction of current input
        // If no input, use player's facing direction (angle)
        let throwX = input.moveX;
        let throwY = input.moveY;

        // If no direction pressed, throw in the direction player is facing
        if (throwX === 0 && throwY === 0) {
          throwX = Math.cos(player.angle);
          throwY = Math.sin(player.angle);
        }

        // Calculate target point for throw
        const throwDistance = 100; // Arbitrary distance for direction
        const targetX = player.x + throwX * throwDistance;
        const targetY = player.y + throwY * throwDistance;

        // Create discus
        const discus = this.physicsSystem.throwDiscus(player, targetX, targetY);
        this.state.discuses.set(discus.id, discus);

        // Player no longer has discus
        player.hasDiscus = false;

        console.log(`Player ${client.sessionId} threw discus ${discus.id} at (${throwX.toFixed(2)}, ${throwY.toFixed(2)})`);
      }

      if (input.blocking) {
        player.state = 'blocking';
      }

      if (input.dodging) {
        player.state = 'dodging';
      }

      // Send acknowledgment to client
      client.send('inputAck', {
        sequenceNumber: input.sequenceNumber,
        timestamp: Date.now(),
        position: { x: player.x, y: player.y },
        velocity: { x: player.velocityX, y: player.velocityY }
      });

      this.eventBus.emit(GameEvents.INPUT_PROCESSED, {
        sessionId: client.sessionId,
        sequenceNumber: input.sequenceNumber
      });
    }
  }

  /**
   * Broadcast state snapshot (20 Hz)
   *
   * Sends full state snapshot to all clients
   * Clients use this for interpolation
   */
  private broadcastSnapshot() {
    this.state.serverTimestamp = Date.now();
    // State is automatically broadcast by Colyseus
    // This method is here for potential optimization later
  }

  /**
   * Check if all players are ready
   */
  private checkAllReady() {
    if (this.state.matchState !== 'waiting') return;

    const allReady = Array.from(this.state.players.values()).every(p => p.isReady);
    const minPlayers = 2;

    if (allReady && this.state.players.size >= minPlayers) {
      this.startMatch();
    }
  }

  /**
   * Start match
   */
  private startMatch() {
    console.log(`Starting match in room ${this.roomId}`);

    this.matchTimer.startMatch(this.state);

    // Update metadata
    this.setMetadata({
      ...this.metadata,
      matchState: 'playing'
    });

    // Broadcast match start to all clients
    this.broadcast('matchStart', {
      timestamp: Date.now()
    });
  }

  /**
   * Player joins
   */
  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined`);

    const player = new PlayerSchema();
    player.sessionId = client.sessionId;
    player.name = options.name || `Player ${this.clients.length}`;
    player.teamId = options.teamId || 'team1';
    player.hasDiscus = true; // Players start with a discus

    // Spawn position (random for now)
    player.x = 200 + Math.random() * 1520;
    player.y = 200 + Math.random() * 680;

    this.state.players.set(client.sessionId, player);

    // Send welcome message
    client.send('playerJoined', {
      sessionId: client.sessionId,
      roomName: this.state.roomName
    });
  }

  /**
   * Player leaves
   */
  async onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left (consented: ${consented})`);

    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (consented) {
      // Immediate removal
      this.removePlayer(client.sessionId);
    } else {
      // Try to reconnect
      player.state = 'disrupted';

      try {
        await this.allowReconnection(client, this.DISCONNECT_TIMEOUT / 1000);
        console.log(`Player ${client.sessionId} reconnected`);
        player.state = 'idle';
        this.eventBus.emit(GameEvents.PLAYER_RECONNECTED, { sessionId: client.sessionId });
      } catch (e) {
        console.log(`Player ${client.sessionId} did not reconnect`);
        this.removePlayer(client.sessionId);
      }
    }
  }

  /**
   * Remove player from game
   */
  private removePlayer(sessionId: string) {
    this.state.players.delete(sessionId);
    this.inputValidator.cleanup(sessionId);
    this.eventBus.emit(GameEvents.PLAYER_DISCONNECTED, { sessionId });

    // Check if room should close
    if (this.state.players.size === 0) {
      console.log(`Room ${this.roomId} is empty, will close`);
    }
  }

  /**
   * Room disposal
   */
  onDispose() {
    console.log(`GameRoom ${this.roomId} disposed`);

    // Clear intervals
    clearInterval(this.tickInterval);
    clearInterval(this.snapshotInterval);

    // Clear event bus
    this.eventBus.clear();
  }
}
