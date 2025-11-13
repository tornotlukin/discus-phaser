import { Scene } from 'phaser';
import { PlayerInput } from '../../shared/types/InputTypes';
import clientConfig from '../../config/client.json';

/**
 * InputManager
 *
 * Handles keyboard and gamepad input
 * Generates PlayerInput messages for server
 */

export class InputManager {
  private scene: Scene;
  private keys: any;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;
  private sequenceNumber: number = 0;

  // Input configuration
  private keyConfig = clientConfig.input.keyboard;
  private gamepadConfig = clientConfig.input.gamepad;

  constructor(scene: Scene) {
    this.scene = scene;

    // Setup keyboard
    if (this.keyConfig.enabled) {
      this.setupKeyboard();
    }

    // Setup gamepad
    if (this.gamepadConfig.enabled) {
      this.setupGamepad();
    }
  }

  /**
   * Setup keyboard controls
   */
  private setupKeyboard(): void {
    const input = this.scene.input;
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes as any;

    this.keys = {
      up: input.keyboard!.addKey(KeyCodes[this.keyConfig.moveUp]),
      down: input.keyboard!.addKey(KeyCodes[this.keyConfig.moveDown]),
      left: input.keyboard!.addKey(KeyCodes[this.keyConfig.moveLeft]),
      right: input.keyboard!.addKey(KeyCodes[this.keyConfig.moveRight]),
      throw: input.keyboard!.addKey(KeyCodes[this.keyConfig.throw]),
      block: input.keyboard!.addKey(KeyCodes[this.keyConfig.block]),
      dodge: input.keyboard!.addKey(KeyCodes[this.keyConfig.dodge])
    };

    console.log('⌨️  Keyboard controls enabled:', {
      movement: `${this.keyConfig.moveUp}/${this.keyConfig.moveDown}/${this.keyConfig.moveLeft}/${this.keyConfig.moveRight}`,
      actions: `${this.keyConfig.throw}/${this.keyConfig.block}/${this.keyConfig.dodge}`
    });
  }

  /**
   * Setup gamepad controls
   */
  private setupGamepad(): void {
    if (!this.scene.input.gamepad) {
      console.warn('Gamepad plugin not available');
      return;
    }

    this.scene.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.gamepad = pad;
      console.log('🎮 Gamepad connected:', pad.id);
    });
  }

  /**
   * Get current input state
   * Returns PlayerInput message or null if no input
   */
  getInput(): PlayerInput | null {
    let moveX = 0;
    let moveY = 0;
    let throwing = false;
    let blocking = false;
    let dodging = false;

    // Keyboard input
    if (this.keys) {
      if (this.keys.left.isDown) moveX -= 1;
      if (this.keys.right.isDown) moveX += 1;
      if (this.keys.up.isDown) moveY -= 1;
      if (this.keys.down.isDown) moveY += 1;

      throwing = this.keys.throw.isDown;
      blocking = this.keys.block.isDown;
      dodging = this.keys.dodge.isDown;
    }

    // Gamepad input (overrides keyboard)
    if (this.gamepad) {
      const leftStick = this.gamepad.leftStick;
      const deadzone = this.gamepadConfig.deadzone;

      if (Math.abs(leftStick.x) > deadzone) {
        moveX = leftStick.x;
      }
      if (Math.abs(leftStick.y) > deadzone) {
        moveY = leftStick.y;
      }

      // Button mappings
      if (this.gamepad.buttons[0]?.pressed) throwing = true;  // A/X button
      if (this.gamepad.buttons[1]?.pressed) blocking = true;  // B/Circle button
      if (this.gamepad.buttons[2]?.pressed) dodging = true;   // X/Square button
    }

    // Return null if no input
    if (moveX === 0 && moveY === 0 && !throwing && !blocking && !dodging) {
      return null;
    }

    // Create input message
    const input: PlayerInput = {
      sequenceNumber: this.sequenceNumber++,
      timestamp: Date.now(),
      moveX,
      moveY,
      throwing,
      blocking,
      dodging
    };

    return input;
  }

  /**
   * Get current movement only (for continuous updates)
   */
  getMovement(): { x: number; y: number } {
    let moveX = 0;
    let moveY = 0;

    // Keyboard
    if (this.keys) {
      if (this.keys.left.isDown) moveX -= 1;
      if (this.keys.right.isDown) moveX += 1;
      if (this.keys.up.isDown) moveY -= 1;
      if (this.keys.down.isDown) moveY += 1;
    }

    // Gamepad
    if (this.gamepad) {
      const leftStick = this.gamepad.leftStick;
      const deadzone = this.gamepadConfig.deadzone;

      if (Math.abs(leftStick.x) > deadzone) {
        moveX = leftStick.x;
      }
      if (Math.abs(leftStick.y) > deadzone) {
        moveY = leftStick.y;
      }
    }

    return { x: moveX, y: moveY };
  }

  /**
   * Normalize movement vector
   */
  normalizeMovement(x: number, y: number): { x: number; y: number } {
    const length = Math.sqrt(x * x + y * y);

    if (length === 0) {
      return { x: 0, y: 0 };
    }

    if (length > 1) {
      return { x: x / length, y: y / length };
    }

    return { x, y };
  }

  /**
   * Check if gamepad is connected
   */
  hasGamepad(): boolean {
    return this.gamepad !== null;
  }
}
