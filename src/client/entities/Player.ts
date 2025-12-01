import { GameObjects, Scene } from "phaser";
import { CONFIG } from "../config";
import type { PlayerState } from "../network/NetworkClient";

export class Player extends GameObjects.Container {
  // Expose for modification
  public bodyGraphics: GameObjects.Rectangle;
  public outlineGraphics: GameObjects.Rectangle;
  public nameText: GameObjects.Text;

  public sessionId: string;
  public isLocal: boolean;

  // Visual settings - modify these
  public bodyColor: number;
  public outlineColor: number = CONFIG.player.outlineColor;
  public outlineWidth: number = CONFIG.player.outlineWidth;

  constructor(scene: Scene, sessionId: string, isLocal: boolean) {
    super(scene, 0, 0);

    this.sessionId = sessionId;
    this.isLocal = isLocal;
    this.bodyColor = isLocal ? CONFIG.player.localColor : CONFIG.player.remoteColor;

    // Create outline (slightly larger rectangle behind)
    this.outlineGraphics = scene.add.rectangle(
      0, 0,
      CONFIG.player.width + this.outlineWidth * 2,
      CONFIG.player.height + this.outlineWidth * 2,
      this.outlineColor
    );
    this.add(this.outlineGraphics);

    // Create body
    this.bodyGraphics = scene.add.rectangle(
      0, 0,
      CONFIG.player.width,
      CONFIG.player.height,
      this.bodyColor
    );
    this.add(this.bodyGraphics);

    // Create name label
    const label = isLocal ? "YOU" : sessionId.substring(0, 4).toUpperCase();
    this.nameText = scene.add.text(0, -CONFIG.player.height / 2 - 15, label, {
      fontSize: "12px",
      color: "#ffffff",
      fontFamily: "monospace",
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    scene.add.existing(this as unknown as GameObjects.GameObject);
  }

  // Update from server state
  updateFromState(state: PlayerState): void {
    this.setPosition(state.x, state.y);
  }

  // Change colors dynamically
  setBodyColor(color: number): void {
    this.bodyColor = color;
    this.bodyGraphics.setFillStyle(color);
  }

  setOutlineColor(color: number): void {
    this.outlineColor = color;
    this.outlineGraphics.setFillStyle(color);
  }

  // Show/hide hitbox visualization
  setHitboxVisible(visible: boolean): void {
    this.outlineGraphics.setStrokeStyle(visible ? 2 : 0, 0xff0000);
  }
}
