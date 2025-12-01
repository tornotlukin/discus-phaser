import { GameObjects, Scene } from "phaser";
import { CONFIG } from "../config";
import type { DiscState } from "../network/NetworkClient";

export class Disc extends GameObjects.Container {
  // Expose for modification
  public bodyGraphics: GameObjects.Arc;
  public glowGraphics: GameObjects.Arc;
  public trailPoints: { x: number; y: number }[] = [];
  public trailGraphics: GameObjects.Graphics;
  public threatTimerBar: GameObjects.Graphics;

  public discId: string;
  public ownerId: string;
  public currentState: "held" | "threat" | "inert" = "held";

  // Threat timer (synced from server)
  public threatTimeRemaining: number = 0;
  public threatTimeMax: number = 30000;

  // Visual settings - modify these
  public radius: number = CONFIG.disc.radius;
  public heldColor: number = CONFIG.disc.heldColor;
  public threatColor: number = CONFIG.disc.threatColor;
  public inertColor: number = CONFIG.disc.inertColor;
  public glowRadius: number = CONFIG.disc.glowRadius;
  public trailLength: number = CONFIG.disc.trailLength;
  public showTrail: boolean = true;
  public showGlow: boolean = true;
  public showThreatTimer: boolean = CONFIG.disc.showThreatTimer;

  constructor(scene: Scene, discId: string, ownerId: string) {
    super(scene, 0, 0);

    this.discId = discId;
    this.ownerId = ownerId;

    // Create trail graphics (in world space, not container)
    this.trailGraphics = scene.add.graphics();

    // Create threat timer bar (above disc)
    this.threatTimerBar = scene.add.graphics();
    this.add(this.threatTimerBar);

    // Create glow effect (larger, semi-transparent circle behind)
    this.glowGraphics = scene.add.arc(0, 0, this.glowRadius, 0, 360, false, this.threatColor, 0.3);
    this.glowGraphics.setVisible(false);
    this.add(this.glowGraphics);

    // Create main disc body
    this.bodyGraphics = scene.add.arc(0, 0, this.radius, 0, 360, false, this.heldColor);
    this.add(this.bodyGraphics);

    scene.add.existing(this as unknown as GameObjects.GameObject);
  }

  // Update from server state
  updateFromState(state: DiscState & { threatTimeRemaining?: number; threatTimeMax?: number }): void {
    // Store previous position for trail
    if (this.showTrail && this.currentState === "threat") {
      this.trailPoints.push({ x: this.x, y: this.y });
      if (this.trailPoints.length > this.trailLength) {
        this.trailPoints.shift();
      }
    }

    this.setPosition(state.x, state.y);

    // Update threat timer
    if (state.threatTimeRemaining !== undefined) {
      this.threatTimeRemaining = state.threatTimeRemaining;
    }
    if (state.threatTimeMax !== undefined) {
      this.threatTimeMax = state.threatTimeMax;
    }

    this.setDiscState(state.state as "held" | "threat" | "inert");
    this.drawThreatTimer();
  }

  // Renamed to avoid conflict with Phaser's setState
  setDiscState(newState: "held" | "threat" | "inert"): void {
    this.currentState = newState;

    // Update color based on state
    let color: number;
    switch (newState) {
      case "held":
        color = this.heldColor;
        this.glowGraphics.setVisible(false);
        this.trailPoints = [];
        this.threatTimerBar.setVisible(false);
        break;
      case "threat":
        color = this.threatColor;
        this.glowGraphics.setVisible(this.showGlow);
        this.glowGraphics.setFillStyle(this.threatColor, 0.3);
        this.threatTimerBar.setVisible(this.showThreatTimer);
        break;
      case "inert":
        color = this.inertColor;
        this.glowGraphics.setVisible(this.showGlow);
        this.glowGraphics.setFillStyle(this.inertColor, 0.2);
        this.trailPoints = [];
        this.threatTimerBar.setVisible(false);
        break;
    }

    this.bodyGraphics.setFillStyle(color);
  }

  // Draw the threat timer bar above the disc
  private drawThreatTimer(): void {
    this.threatTimerBar.clear();

    if (!this.showThreatTimer || this.currentState !== "threat") return;

    const width = CONFIG.disc.threatTimerWidth;
    const height = CONFIG.disc.threatTimerHeight;
    const x = -width / 2;
    const y = -this.radius - height - 5;

    // Background
    this.threatTimerBar.fillStyle(0x333333, 0.8);
    this.threatTimerBar.fillRect(x, y, width, height);

    // Fill based on time remaining
    const ratio = Math.max(0, this.threatTimeRemaining / this.threatTimeMax);
    const fillColor = ratio > 0.3 ? this.threatColor : 0xff0000;
    this.threatTimerBar.fillStyle(fillColor, 1);
    this.threatTimerBar.fillRect(x, y, width * ratio, height);
  }

  // Call this in scene update to draw trail
  drawTrail(): void {
    this.trailGraphics.clear();

    if (!this.showTrail || this.trailPoints.length < 2) return;

    // Draw trail with fading alpha
    for (let i = 1; i < this.trailPoints.length; i++) {
      const alpha = i / this.trailPoints.length;
      const thickness = (i / this.trailPoints.length) * this.radius;

      this.trailGraphics.lineStyle(thickness, this.threatColor, alpha * 0.5);
      this.trailGraphics.lineBetween(
        this.trailPoints[i - 1].x,
        this.trailPoints[i - 1].y,
        this.trailPoints[i].x,
        this.trailPoints[i].y
      );
    }

    // Line from last trail point to current position
    if (this.trailPoints.length > 0) {
      const last = this.trailPoints[this.trailPoints.length - 1];
      this.trailGraphics.lineStyle(this.radius, this.threatColor, 0.5);
      this.trailGraphics.lineBetween(last.x, last.y, this.x, this.y);
    }
  }

  destroy(fromScene?: boolean): void {
    this.trailGraphics.destroy();
    super.destroy(fromScene);
  }
}
