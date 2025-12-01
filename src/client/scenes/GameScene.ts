import { Scene, Input, GameObjects } from "phaser";
import { CONFIG } from "../config";
import { NetworkClient, PlayerState, DiscState } from "../network/NetworkClient";
import { Player } from "../entities/Player";
import { Disc } from "../entities/Disc";

export class GameScene extends Scene {
  // Expose network client for external access
  public network!: NetworkClient;

  // Expose entity maps for external access
  public players: Map<string, Player> = new Map();
  public discs: Map<string, Disc> = new Map();

  // Expose arena graphics
  public arenaGraphics!: GameObjects.Graphics;
  public wallGraphics!: GameObjects.Graphics;

  // Expose UI elements
  public fpsText!: GameObjects.Text;
  public latencyText!: GameObjects.Text;
  public scoreText!: GameObjects.Text;
  public statusText!: GameObjects.Text;

  // Input keys - exposed for rebinding
  public keys!: {
    up: Input.Keyboard.Key;
    down: Input.Keyboard.Key;
    left: Input.Keyboard.Key;
    right: Input.Keyboard.Key;
    throw: Input.Keyboard.Key;
  };

  // Input state
  private lastInputX: number = 0;
  private lastInputY: number = 0;
  private canThrow: boolean = true;

  // Mouse position for aiming
  public mouseX: number = 0;
  public mouseY: number = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    // Setup arena visuals
    this.createArena();

    // Setup input
    this.setupInput();

    // Setup UI
    this.createUI();

    // Connect to server
    this.connectToServer();
  }

  private createArena(): void {
    const width = CONFIG.display.width;
    const height = CONFIG.display.height;
    const wall = CONFIG.arena.wallThickness;

    // Floor
    this.arenaGraphics = this.add.graphics();
    this.arenaGraphics.fillStyle(CONFIG.arena.floorColor);
    this.arenaGraphics.fillRect(wall, wall, width - wall * 2, height - wall * 2);

    // Walls
    this.wallGraphics = this.add.graphics();
    this.wallGraphics.fillStyle(CONFIG.arena.wallColor);
    // Top
    this.wallGraphics.fillRect(0, 0, width, wall);
    // Bottom
    this.wallGraphics.fillRect(0, height - wall, width, wall);
    // Left
    this.wallGraphics.fillRect(0, 0, wall, height);
    // Right
    this.wallGraphics.fillRect(width - wall, 0, wall, height);

    // Center line (optional visual)
    this.arenaGraphics.lineStyle(1, 0x333355, 0.5);
    this.arenaGraphics.lineBetween(width / 2, wall, width / 2, height - wall);
  }

  private setupInput(): void {
    // Keyboard
    this.keys = {
      up: this.input.keyboard!.addKey(CONFIG.input.up),
      down: this.input.keyboard!.addKey(CONFIG.input.down),
      left: this.input.keyboard!.addKey(CONFIG.input.left),
      right: this.input.keyboard!.addKey(CONFIG.input.right),
      throw: this.input.keyboard!.addKey(CONFIG.input.throw),
    };

    // Mouse tracking
    this.input.on("pointermove", (pointer: Input.Pointer) => {
      this.mouseX = pointer.x;
      this.mouseY = pointer.y;
    });

    // Mouse click to throw
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleThrow();
      }
    });

    // Spacebar throw
    this.keys.throw.on("down", () => {
      this.handleThrow();
    });
  }

  private createUI(): void {
    const style = {
      fontSize: "14px",
      color: "#ffffff",
      fontFamily: "monospace",
      backgroundColor: "#00000088",
      padding: { x: 5, y: 3 },
    };

    // Status text (top center)
    this.statusText = this.add.text(CONFIG.display.width / 2, 20, "Connecting...", {
      ...style,
      fontSize: "16px",
    });
    this.statusText.setOrigin(0.5, 0);

    // Score text (top center, below status)
    this.scoreText = this.add.text(CONFIG.display.width / 2, 50, "", {
      ...style,
      fontSize: "20px",
    });
    this.scoreText.setOrigin(0.5, 0);

    // FPS counter (top left)
    if (CONFIG.debug.showFPS) {
      this.fpsText = this.add.text(10, 10, "FPS: --", style);
    }

    // Latency (top left, below FPS)
    if (CONFIG.debug.showLatency) {
      this.latencyText = this.add.text(10, 30, "Ping: --", style);
    }
  }

  private async connectToServer(): Promise<void> {
    this.network = new NetworkClient();

    // Setup callbacks
    this.network.onConnected = () => {
      this.statusText.setText("Connected! Waiting for opponent...");
    };

    this.network.onDisconnected = () => {
      this.statusText.setText("Disconnected from server");
    };

    this.network.onPlayerJoin = (player: PlayerState) => {
      this.addPlayer(player);
      this.updateStatusText();
    };

    this.network.onPlayerLeave = (sessionId: string) => {
      this.removePlayer(sessionId);
      this.updateStatusText();
    };

    this.network.onPlayerUpdate = (player: PlayerState) => {
      const entity = this.players.get(player.sessionId);
      if (entity) {
        entity.updateFromState(player);
      }
      this.updateScoreText();
    };

    this.network.onDiscUpdate = (disc: DiscState) => {
      let entity = this.discs.get(disc.id);
      if (!entity) {
        entity = this.addDisc(disc);
      }
      entity.updateFromState(disc);
    };

    this.network.onPlayerHit = (data) => {
      // Flash effect on hit
      this.cameras.main.flash(100, 255, 255, 255, false);

      // Could add more hit effects here
      console.log(`${data.hitPlayerId} was hit by ${data.byPlayerId}`);
    };

    // Connect
    try {
      await this.network.connect("game");
    } catch (error) {
      this.statusText.setText("Failed to connect to server");
      console.error(error);
    }
  }

  private addPlayer(state: PlayerState): Player {
    const isLocal = this.network.isLocalPlayer(state.sessionId);
    const player = new Player(this, state.sessionId, isLocal);
    player.updateFromState(state);

    if (CONFIG.debug.showHitboxes) {
      player.setHitboxVisible(true);
    }

    this.players.set(state.sessionId, player);
    return player;
  }

  private removePlayer(sessionId: string): void {
    const player = this.players.get(sessionId);
    if (player) {
      player.destroy();
      this.players.delete(sessionId);
    }

    // Also remove their disc
    const discId = `disc_${sessionId}`;
    const disc = this.discs.get(discId);
    if (disc) {
      disc.destroy();
      this.discs.delete(discId);
    }
  }

  private addDisc(state: DiscState): Disc {
    const disc = new Disc(this, state.id, state.ownerId);
    disc.updateFromState(state);
    this.discs.set(state.id, disc);
    return disc;
  }

  private handleThrow(): void {
    if (!this.network.connected || !this.canThrow) return;

    const localPlayer = this.network.getLocalPlayer();
    if (!localPlayer || !localPlayer.hasDisc) return;

    // Throw toward mouse position
    this.network.sendThrow(this.mouseX, this.mouseY);

    // Brief cooldown to prevent spam
    this.canThrow = false;
    this.time.delayedCall(100, () => {
      this.canThrow = true;
    });
  }

  private updateStatusText(): void {
    const playerCount = this.players.size;
    if (playerCount < 2) {
      this.statusText.setText(`Waiting for opponent... (${playerCount}/2)`);
    } else {
      this.statusText.setText("FIGHT!");
      // Fade out status after game starts
      this.time.delayedCall(2000, () => {
        this.statusText.setAlpha(0);
      });
    }
  }

  private updateScoreText(): void {
    const scores: string[] = [];
    this.network.players.forEach((player, sessionId) => {
      const isLocal = this.network.isLocalPlayer(sessionId);
      const label = isLocal ? "YOU" : "OPP";
      scores.push(`${label}: ${player.score}`);
    });
    this.scoreText.setText(scores.join("  |  "));
  }

  update(_time: number, _delta: number): void {
    // Update FPS display
    if (CONFIG.debug.showFPS && this.fpsText) {
      this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }

    // Process input and send to server
    this.processInput();

    // Draw disc trails
    this.discs.forEach((disc) => {
      disc.drawTrail();
    });
  }

  private processInput(): void {
    if (!this.network.connected) return;

    let inputX = 0;
    let inputY = 0;

    // Read keyboard input
    if (this.keys.left.isDown) inputX -= 1;
    if (this.keys.right.isDown) inputX += 1;
    if (this.keys.up.isDown) inputY -= 1;
    if (this.keys.down.isDown) inputY += 1;

    // Only send if input changed
    if (inputX !== this.lastInputX || inputY !== this.lastInputY) {
      this.network.sendInput(inputX, inputY);
      this.lastInputX = inputX;
      this.lastInputY = inputY;
    }
  }

  // Public methods for external control

  // Change arena colors at runtime
  setArenaColors(floor: number, wall: number): void {
    CONFIG.arena.floorColor = floor;
    CONFIG.arena.wallColor = wall;
    this.createArena(); // Redraw
  }

  // Get local player entity
  getLocalPlayer(): Player | undefined {
    return this.players.get(this.network.sessionId);
  }

  // Get all remote players
  getRemotePlayers(): Player[] {
    return Array.from(this.players.values()).filter((p) => !p.isLocal);
  }
}
