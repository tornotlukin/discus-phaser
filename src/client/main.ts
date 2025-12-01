import { Game, AUTO } from "phaser";
import { CONFIG } from "./config";
import { GameScene } from "./scenes/GameScene";

// Expose game instance globally for debugging
declare global {
  interface Window {
    game: Game;
    gameScene: GameScene;
  }
}

// Phaser game configuration - modify as needed
const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: "game-container",
  width: CONFIG.display.width,
  height: CONFIG.display.height,
  backgroundColor: CONFIG.display.backgroundColor,
  scene: [GameScene],
  physics: {
    default: "arcade",
    arcade: {
      // No gravity for top-down game
      gravity: { x: 0, y: 0 },
      debug: CONFIG.debug.showHitboxes,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: true,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

// Create and start the game
const game = new Game(phaserConfig);

// Expose for console debugging
window.game = game;

// Get scene reference once it's created
game.events.once("ready", () => {
  const scene = game.scene.getScene("GameScene") as GameScene;
  if (scene) {
    window.gameScene = scene;
  }
});

console.log("DISCUS client started");
console.log("Access game via window.game and window.gameScene in console");
