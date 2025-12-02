// ===========================================
// CLIENT CONFIGURATION - Modify these values
// ===========================================

export const CONFIG = {
  // Server connection
  server: {
    host: "localhost",
    port: 2567,
    secure: false, // Use wss:// if true
  },

  // Game display
  display: {
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
  },

  // Arena styling
  arena: {
    wallColor: 0x4a4e69,
    wallThickness: 10,
    floorColor: 0x16213e,
  },

  // Player appearance
  player: {
    width: 40,
    height: 60,
    localColor: 0x00ff88,      // Your player
    remoteColor: 0xff4444,     // Opponent
    outlineWidth: 2,
    outlineColor: 0xffffff,
  },

  // Disc appearance
  disc: {
    radius: 12,
    heldColor: 0x888888,
    threatColor: 0xffff00,
    inertColor: 0x00ffff,      // Renamed from returningColor
    glowRadius: 20,
    trailLength: 10,
    // Threat timer UI
    showThreatTimer: true,
    threatTimerWidth: 30,
    threatTimerHeight: 4,
  },

  // Input settings
  input: {
    // Keyboard bindings (fallback)
    keyboard: {
      p1: { up: "W", down: "S", left: "A", right: "D", throw: "SPACE" },
      p2: { up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", throw: "ENTER" },
    },
    // Gamepad settings (Xbox-style button indices)
    gamepad: {
      deadzone: 0.2,           // D-pad/stick deadzone
      // Button indices (standard gamepad mapping)
      // https://w3c.github.io/gamepad/#remapping
      throwButton: 0,          // A button (index 0)
      blockButton: 1,          // B button (index 1) - future
      dashButton: 2,           // X button (index 2) - future
      startButton: 9,          // START button (index 9)
      // D-pad axes (some controllers use axes, some use buttons)
      // Buttons 12-15 are D-pad: Up=12, Down=13, Left=14, Right=15
      dpadUp: 12,
      dpadDown: 13,
      dpadLeft: 14,
      dpadRight: 15,
    },
  },

  // Debug options
  debug: {
    showFPS: true,
    showLatency: true,
    showHitboxes: false,
    logNetworkMessages: false,
  },
};

// Helper to get WebSocket URL
export function getServerUrl(): string {
  const protocol = CONFIG.server.secure ? "wss" : "ws";
  return `${protocol}://${CONFIG.server.host}:${CONFIG.server.port}`;
}
