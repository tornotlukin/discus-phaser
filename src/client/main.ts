import { Game, WEBGL } from 'phaser';
import { GameScene } from './scenes/GameScene';
import clientConfig from '../config/client.json';

/**
 * DISCUS Client
 * Simple prototype with rectangles and circles
 */

const config = {
  type: WEBGL,
  width: clientConfig.rendering.gameWidth,
  height: clientConfig.rendering.gameHeight,
  backgroundColor: clientConfig.rendering.backgroundColor,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

// Create game instance
const game = new Game(config);

// Expose for debugging
(window as any).game = game;
(window as any).config = clientConfig;

console.log('🎮 DISCUS Client Started');
console.log(`📡 Server: ${clientConfig.server.url}`);
console.log(`🎨 Game Size: ${clientConfig.rendering.gameWidth}x${clientConfig.rendering.gameHeight}`);
