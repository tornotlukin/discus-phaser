import { Scene } from 'phaser';
import { Client, Room } from 'colyseus.js';
import { RoomState } from '../../shared/schemas/RoomState';
import { PlayerSchema } from '../../shared/schemas/PlayerSchema';
import { DiscusSchema } from '../../shared/schemas/DiscusSchema';
import { InputManager } from '../systems/InputManager';
import { PlayerInput } from '../../shared/types/InputTypes';
import { SettingsPanel } from '../ui/SettingsPanel';
import clientConfig from '../../config/client.json';

/**
 * GameScene
 *
 * Main game scene with server connection
 * Simple prototype with rectangles (players) and circles (discuses)
 */

export class GameScene extends Scene {
  // Colyseus
  private client!: Client;
  private room!: Room<RoomState>;
  private sessionId: string = '';

  // Input
  private inputManager!: InputManager;

  // UI
  private settingsPanel!: SettingsPanel;

  // Rendering
  private border!: Phaser.GameObjects.Graphics;
  private playerGraphics: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private discusGraphics: Map<string, Phaser.GameObjects.Arc> = new Map();
  private debugText!: Phaser.GameObjects.Text;

  // Configuration
  private renderConfig = clientConfig.rendering;
  private playerConfig = clientConfig.player;
  private discusConfig = clientConfig.discus;
  private networkConfig = clientConfig.network;

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Initialize scene
   */
  init(): void {
    console.log('🎮 GameScene initialized');
  }

  /**
   * Create scene objects
   */
  create(): void {
    console.log('🎨 Creating game scene...');

    // Create border (10px white border)
    this.createBorder();

    // Create debug text
    if (this.networkConfig.showDebugInfo) {
      this.debugText = this.add.text(20, 20, 'Connecting...', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff'
      });
    }

    // Setup input
    this.inputManager = new InputManager(this);

    // Setup developer settings panel
    this.setupSettingsPanel();

    // Connect to server
    this.connectToServer();
  }

  /**
   * Create game border
   */
  private createBorder(): void {
    this.border = this.add.graphics();
    this.border.lineStyle(
      this.renderConfig.borderWidth,
      parseInt(this.renderConfig.borderColor.replace('#', '0x')),
      1
    );
    this.border.strokeRect(
      0,
      0,
      this.renderConfig.gameWidth,
      this.renderConfig.gameHeight
    );
  }

  /**
   * Setup developer settings panel (CTRL+SHIFT+S)
   */
  private setupSettingsPanel(): void {
    this.settingsPanel = new SettingsPanel();

    // Register physics settings
    this.settingsPanel.registerSettings([
      {
        key: 'playerSpeed',
        label: 'Player Speed',
        value: 200,
        min: 0,
        max: 1000,
        step: 10,
        category: 'Movement'
      },
      {
        key: 'playerAcceleration',
        label: 'Player Acceleration',
        value: 800,
        min: 0,
        max: 2000,
        step: 50,
        category: 'Movement'
      },
      {
        key: 'playerFriction',
        label: 'Player Friction',
        value: 600,
        min: 0,
        max: 2000,
        step: 50,
        category: 'Movement'
      },
      {
        key: 'playerRadius',
        label: 'Player Radius',
        value: 16,
        min: 8,
        max: 50,
        step: 1,
        category: 'Size'
      },
      {
        key: 'discusSpeed',
        label: 'Discus Speed',
        value: 400,
        min: 0,
        max: 1000,
        step: 10,
        category: 'Discus'
      },
      {
        key: 'discusRadius',
        label: 'Discus Radius',
        value: 8,
        min: 4,
        max: 30,
        step: 1,
        category: 'Size'
      }
    ]);

    // Handle setting changes
    this.settingsPanel.onChange((key: string, value: number) => {
      console.log(`⚙️ Setting changed: ${key} = ${value}`);

      // Send to server
      if (this.room) {
        this.room.send('updateConfig', { [key]: value });
      }
    });
  }

  /**
   * Connect to Colyseus server
   */
  private async connectToServer(): Promise<void> {
    try {
      console.log(`📡 Connecting to ${clientConfig.server.url}...`);

      this.client = new Client(clientConfig.server.url);

      // Join or create room
      this.room = await this.client.joinOrCreate<RoomState>(clientConfig.server.roomName, {
        name: 'Player',
        teamId: 'team1'
      });

      this.sessionId = this.room.sessionId;
      console.log(`✅ Connected! Session ID: ${this.sessionId}`);

      // Setup room listeners
      this.setupRoomListeners();

    } catch (error) {
      console.error('❌ Connection failed:', error);
      if (this.debugText) {
        this.debugText.setText('Connection failed!\nIs server running?');
      }
    }
  }

  /**
   * Setup room event listeners
   */
  private setupRoomListeners(): void {
    // Player joined
    this.room.state.players.onAdd((player: PlayerSchema, sessionId: string) => {
      console.log(`Player ${sessionId} joined`);
      this.createPlayerGraphic(player, sessionId);
    });

    // Player removed
    this.room.state.players.onRemove((player: PlayerSchema, sessionId: string) => {
      console.log(`Player ${sessionId} left`);
      this.removePlayerGraphic(sessionId);
    });

    // Discus added
    this.room.state.discuses.onAdd((discus: DiscusSchema, discusId: string) => {
      this.createDiscusGraphic(discus, discusId);
    });

    // Discus removed
    this.room.state.discuses.onRemove((discus: DiscusSchema, discusId: string) => {
      this.removeDiscusGraphic(discusId);
    });

    // Input acknowledgment (for reconciliation)
    this.room.onMessage('inputAck', (message) => {
      // TODO: Implement client-side reconciliation
    });

    // Match start
    this.room.onMessage('matchStart', () => {
      console.log('🎮 Match started!');
    });

    // Config updated (from dev settings)
    this.room.onMessage('configUpdated', (config: Record<string, number>) => {
      console.log('⚙️ Config updated from server:', config);

      // Update settings panel to reflect new values
      Object.entries(config).forEach(([key, value]) => {
        this.settingsPanel.updateSetting(key, value);
      });
    });
  }

  /**
   * Create player graphic (rectangle)
   */
  private createPlayerGraphic(player: PlayerSchema, sessionId: string): void {
    // Choose color based on whether it's the local player
    const isLocalPlayer = sessionId === this.sessionId;
    const color = isLocalPlayer
      ? parseInt(this.playerConfig.color.replace('#', '0x'))
      : parseInt(this.playerConfig.player2Color.replace('#', '0x'));

    const rect = this.add.rectangle(
      player.x,
      player.y,
      this.playerConfig.width,
      this.playerConfig.height,
      color
    );

    this.playerGraphics.set(sessionId, rect);

    console.log(`Created player graphic for ${sessionId} at (${player.x}, ${player.y})`);
  }

  /**
   * Remove player graphic
   */
  private removePlayerGraphic(sessionId: string): void {
    const graphic = this.playerGraphics.get(sessionId);
    if (graphic) {
      graphic.destroy();
      this.playerGraphics.delete(sessionId);
    }
  }

  /**
   * Create discus graphic (circle)
   */
  private createDiscusGraphic(discus: DiscusSchema, discusId: string): void {
    const color = discus.state === 'threat'
      ? parseInt(this.discusConfig.color.replace('#', '0x'))
      : parseInt(this.discusConfig.inertColor.replace('#', '0x'));

    const circle = this.add.circle(
      discus.x,
      discus.y,
      this.discusConfig.radius,
      color
    );

    this.discusGraphics.set(discusId, circle);
  }

  /**
   * Remove discus graphic
   */
  private removeDiscusGraphic(discusId: string): void {
    const graphic = this.discusGraphics.get(discusId);
    if (graphic) {
      graphic.destroy();
      this.discusGraphics.delete(discusId);
    }
  }

  /**
   * Update loop
   */
  update(_time: number, _delta: number): void {
    if (!this.room) return;

    // Send input to server
    this.sendInput();

    // Update player graphics positions
    this.updatePlayerGraphics();

    // Update discus graphics positions
    this.updateDiscusGraphics();

    // Update debug info
    if (this.debugText) {
      this.updateDebugInfo();
    }
  }

  /**
   * Send input to server
   */
  private sendInput(): void {
    const movement = this.inputManager.getMovement();
    const fullInput = this.inputManager.getInput();

    // Always send movement (even if zero) for smooth server updates
    const input: PlayerInput = {
      sequenceNumber: Date.now(), // Simple sequence for now
      timestamp: Date.now(),
      moveX: movement.x,
      moveY: movement.y,
      throwing: fullInput?.throwing || false,
      blocking: fullInput?.blocking || false,
      dodging: fullInput?.dodging || false
    };

    this.room.send('input', input);
  }

  /**
   * Update player graphic positions from server state
   */
  private updatePlayerGraphics(): void {
    this.room.state.players.forEach((player: PlayerSchema, sessionId: string) => {
      const graphic = this.playerGraphics.get(sessionId);
      if (graphic) {
        graphic.x = player.x;
        graphic.y = player.y;

        // Rotate rectangle based on angle
        graphic.rotation = player.angle;
      }
    });
  }

  /**
   * Update discus graphic positions from server state
   */
  private updateDiscusGraphics(): void {
    this.room.state.discuses.forEach((discus: DiscusSchema, discusId: string) => {
      const graphic = this.discusGraphics.get(discusId);
      if (graphic) {
        graphic.x = discus.x;
        graphic.y = discus.y;

        // Update color based on state
        const color = discus.state === 'threat'
          ? parseInt(this.discusConfig.color.replace('#', '0x'))
          : parseInt(this.discusConfig.inertColor.replace('#', '0x'));
        graphic.fillColor = color;
      }
    });
  }

  /**
   * Update debug info
   */
  private updateDebugInfo(): void {
    const playerCount = this.room.state.players.size;
    const discusCount = this.room.state.discuses.size;
    const matchState = this.room.state.matchState;
    const matchTime = Math.floor(this.room.state.matchTime);

    const localPlayer = this.room.state.players.get(this.sessionId);
    const position = localPlayer ? `(${Math.floor(localPlayer.x)}, ${Math.floor(localPlayer.y)})` : 'N/A';

    const debugInfo = [
      `Session: ${this.sessionId.substring(0, 8)}...`,
      `Players: ${playerCount}`,
      `Discuses: ${discusCount}`,
      `Match: ${matchState}`,
      `Time: ${matchTime}s`,
      `Position: ${position}`,
      `Gamepad: ${this.inputManager.hasGamepad() ? 'Yes' : 'No'}`,
      '',
      'Controls:',
      'WASD - Move',
      'Space - Throw (TODO)',
      'Shift - Block (TODO)',
      'Ctrl - Dodge (TODO)'
    ];

    this.debugText.setText(debugInfo.join('\n'));
  }

  /**
   * Cleanup on scene shutdown
   */
  shutdown(): void {
    if (this.room) {
      this.room.leave();
    }
  }
}
