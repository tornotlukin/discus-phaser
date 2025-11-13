# Assets Management Guide

**Folder:** `assets/`
**Purpose:** Game assets (sprites, audio, fonts, shaders)

---

## Overview

This folder contains all binary assets for the DISCUS game, including:
- Sprite sheets and textures
- Sound effects and music
- Custom fonts
- Custom shaders
- UI elements

## Key Principles

- **Not compiled by TypeScript** - These are binary/resource files
- **Referenced by path from code** - Load via Phaser's asset loader
- **Consider Git LFS for large files** - Keep repository size manageable
- **Organize by type** - Sprites, audio, fonts, etc.

---

## Folder Structure

```
assets/
├── sprites/               # Sprite sheets and textures
│   ├── players/          # Player sprites
│   │   ├── player-red.png
│   │   ├── player-blue.png
│   │   ├── player-green.png
│   │   └── player-atlas.json
│   │
│   ├── discus/           # Discus sprites
│   │   ├── discus-threat.png
│   │   ├── discus-inert.png
│   │   └── discus-trail.png
│   │
│   ├── hazards/          # Hazard sprites
│   │   ├── drone.png
│   │   ├── wall-spike.png
│   │   └── hazard-atlas.json
│   │
│   └── ui/               # UI elements
│       ├── button.png
│       ├── panel.png
│       └── ui-atlas.json
│
├── audio/                # Sound effects and music
│   ├── sfx/             # Sound effects
│   │   ├── throw.wav
│   │   ├── catch.wav
│   │   ├── hit.wav
│   │   ├── block.wav
│   │   └── dodge.wav
│   │
│   └── music/           # Background music
│       ├── menu.mp3
│       ├── gameplay.mp3
│       └── results.mp3
│
├── fonts/               # Custom fonts
│   ├── game-font.ttf
│   ├── ui-font.woff
│   └── score-font.ttf
│
└── shaders/             # Custom shaders
    ├── outline.glsl     # Colorblind outline shader
    └── trail.glsl       # Discus trail shader
```

---

## Asset Loading in Phaser

### Preload Assets

```typescript
// In Phaser Scene
preload(): void {
  // Load images
  this.load.image('player-red', 'assets/sprites/players/player-red.png');
  this.load.image('discus', 'assets/sprites/discus/discus-threat.png');

  // Load sprite atlases
  this.load.atlas(
    'player-atlas',
    'assets/sprites/players/player-atlas.png',
    'assets/sprites/players/player-atlas.json'
  );

  // Load audio
  this.load.audio('throw-sfx', 'assets/audio/sfx/throw.wav');
  this.load.audio('menu-music', 'assets/audio/music/menu.mp3');

  // Load fonts
  this.load.font('game-font', 'assets/fonts/game-font.ttf');
}
```

### Use Loaded Assets

```typescript
create(): void {
  // Create sprites
  const player = this.add.sprite(100, 100, 'player-red');

  // Create sprite from atlas
  const animatedPlayer = this.add.sprite(200, 200, 'player-atlas', 'idle-01');

  // Play audio
  this.sound.play('throw-sfx');

  // Create text with custom font
  const text = this.add.text(400, 300, 'DISCUS', {
    fontFamily: 'game-font',
    fontSize: 64
  });
}
```

---

## Asset Organization Guidelines

### Naming Conventions

```
// ✅ GOOD: Descriptive kebab-case names
player-red-idle.png
player-blue-walk.png
discus-threat-glow.png
throw-sound.wav

// ❌ BAD: Unclear or inconsistent names
pr1.png
pBluewalk.png
disc_threat.png
snd1.wav
```

### Sprite Sheets vs. Individual Images

**Use Sprite Sheets When:**
- Multiple related frames (animations)
- Many small images (UI elements)
- Need to optimize texture memory

**Use Individual Images When:**
- Single, large images (backgrounds)
- Infrequently used assets
- Easier to iterate during development

### Texture Atlases

Create texture atlases with tools like:
- TexturePacker: https://www.codeandweb.com/texturepacker
- Shoebox: https://renderhjs.net/shoebox/
- Free Texture Packer: https://github.com/odrick/free-tex-packer

Example atlas JSON structure:

```json
{
  "frames": {
    "player-idle-01.png": {
      "frame": { "x": 0, "y": 0, "w": 32, "h": 32 },
      "sourceSize": { "w": 32, "h": 32 }
    },
    "player-idle-02.png": {
      "frame": { "x": 32, "y": 0, "w": 32, "h": 32 },
      "sourceSize": { "w": 32, "h": 32 }
    }
  }
}
```

---

## Audio Guidelines

### Audio Format Recommendations

**Sound Effects:**
- Format: WAV or OGG
- Sample Rate: 44.1 kHz
- Bit Depth: 16-bit
- Length: Keep short (< 2 seconds)

**Background Music:**
- Format: MP3 or OGG
- Bitrate: 128-192 kbps
- Length: Loop seamlessly

### Audio Implementation

```typescript
// Preload audio
preload(): void {
  this.load.audio('throw', 'assets/audio/sfx/throw.wav');
  this.load.audio('music', 'assets/audio/music/gameplay.mp3');
}

// Play sound effect
create(): void {
  // One-shot sound
  this.sound.play('throw');

  // Background music (looping)
  const music = this.sound.add('music', {
    loop: true,
    volume: 0.5
  });
  music.play();
}
```

---

## Font Guidelines

### Web Fonts

```typescript
// Load custom web font
preload(): void {
  this.load.font('game-font', 'assets/fonts/game-font.woff');
}

// Use font
create(): void {
  const text = this.add.text(400, 300, 'DISCUS', {
    fontFamily: 'game-font',
    fontSize: 64,
    color: '#ffffff'
  });
}
```

### System Fonts (Fallback)

```typescript
// Use system fonts as fallback
const text = this.add.text(400, 300, 'DISCUS', {
  fontFamily: 'Arial, sans-serif',
  fontSize: 64
});
```

---

## Shaders

### Custom GLSL Shaders

**`assets/shaders/outline.glsl`:**

```glsl
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform vec4 uOutlineColor;
uniform float uOutlineThickness;

varying vec2 outTexCoord;

void main() {
  vec4 color = texture2D(uMainSampler, outTexCoord);

  // Sample surrounding pixels
  float alpha = 0.0;
  for (float x = -1.0; x <= 1.0; x++) {
    for (float y = -1.0; y <= 1.0; y++) {
      vec2 offset = vec2(x, y) * uOutlineThickness / uResolution;
      alpha += texture2D(uMainSampler, outTexCoord + offset).a;
    }
  }

  // Apply outline
  if (color.a == 0.0 && alpha > 0.0) {
    gl_FragColor = uOutlineColor;
  } else {
    gl_FragColor = color;
  }
}
```

### Using Shaders in Phaser

```typescript
// Load shader
preload(): void {
  this.load.glsl('outline', 'assets/shaders/outline.glsl');
}

// Apply shader to sprite
create(): void {
  const player = this.add.sprite(100, 100, 'player-red');

  // Create and apply shader
  const outlineShader = this.add.shader('outline', 100, 100, 32, 32);
  outlineShader.setUniform('uOutlineColor', [1.0, 0.0, 0.0, 1.0]);
  outlineShader.setUniform('uOutlineThickness', 2.0);
}
```

---

## Git LFS (Large File Storage)

### When to Use Git LFS

Use Git LFS for:
- ✅ Large images (> 1 MB)
- ✅ Audio files (> 500 KB)
- ✅ Video files
- ✅ Large sprite sheets

Don't use Git LFS for:
- ❌ Small images (< 100 KB)
- ❌ JSON files
- ❌ Text files
- ❌ Code

### Setting Up Git LFS

```bash
# Install Git LFS
git lfs install

# Track file types
git lfs track "*.png"
git lfs track "*.jpg"
git lfs track "*.wav"
git lfs track "*.mp3"
git lfs track "*.ogg"

# Commit .gitattributes
git add .gitattributes
git commit -m "Configure Git LFS"
```

### `.gitattributes` Example

```
# Images
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text

# Audio
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text

# Fonts
*.ttf filter=lfs diff=lfs merge=lfs -text
*.otf filter=lfs diff=lfs merge=lfs -text
*.woff filter=lfs diff=lfs merge=lfs -text
*.woff2 filter=lfs diff=lfs merge=lfs -text
```

---

## Asset Optimization

### Image Optimization

**Tools:**
- TinyPNG: https://tinypng.com/
- ImageOptim: https://imageoptim.com/
- Squoosh: https://squoosh.app/

**Guidelines:**
- Use PNG for sprites with transparency
- Use JPEG for backgrounds without transparency
- Compress images before adding to repository
- Use appropriate resolution (avoid oversized textures)

### Audio Optimization

**Tools:**
- Audacity: https://www.audacityteam.org/
- FFmpeg: https://ffmpeg.org/

**Guidelines:**
- Normalize audio levels
- Remove silence at start/end
- Use appropriate bitrates (128-192 kbps for music)
- Consider OGG Vorbis for better compression

---

## Asset Pipeline

### Development Workflow

1. **Create/Edit Asset** - Use your preferred tool (Photoshop, GIMP, Aseprite, etc.)
2. **Export Asset** - Export to appropriate format (PNG, WAV, etc.)
3. **Optimize Asset** - Compress and optimize file size
4. **Add to Assets Folder** - Place in appropriate subfolder
5. **Reference in Code** - Load via Phaser in preload()
6. **Test in Game** - Verify asset displays/plays correctly

### Asset Naming Checklist

- [ ] Descriptive name (what is it?)
- [ ] kebab-case format
- [ ] Includes variant if applicable (red, blue, idle, walk)
- [ ] Appropriate file extension
- [ ] No spaces or special characters

---

## Common Patterns

### Preload Scene Pattern

```typescript
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Show loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    // Load all assets
    this.loadSprites();
    this.loadAudio();
    this.loadFonts();
  }

  private loadSprites(): void {
    this.load.image('player-red', 'assets/sprites/players/player-red.png');
    this.load.image('discus', 'assets/sprites/discus/discus-threat.png');
    // ... more sprites
  }

  private loadAudio(): void {
    this.load.audio('throw', 'assets/audio/sfx/throw.wav');
    this.load.audio('music', 'assets/audio/music/gameplay.mp3');
    // ... more audio
  }

  private loadFonts(): void {
    this.load.font('game-font', 'assets/fonts/game-font.woff');
    // ... more fonts
  }

  create(): void {
    // Start next scene
    this.scene.start('MenuScene');
  }
}
```

---

## Resources

**Image Creation:**
- Aseprite: https://www.aseprite.org/
- GIMP: https://www.gimp.org/
- Krita: https://krita.org/

**Audio Creation:**
- Audacity: https://www.audacityteam.org/
- LMMS: https://lmms.io/
- Bfxr: https://www.bfxr.net/

**Font Resources:**
- Google Fonts: https://fonts.google.com/
- Font Squirrel: https://www.fontsquirrel.com/
- DaFont: https://www.dafont.com/

**Texture Packing:**
- TexturePacker: https://www.codeandweb.com/texturepacker
- Free Texture Packer: https://github.com/odrick/free-tex-packer

---

## Key Reminders

- **Organize by type** - Sprites, audio, fonts, shaders
- **Use descriptive names** - kebab-case, no spaces
- **Optimize file sizes** - Compress images and audio
- **Consider Git LFS** - For large files (> 1 MB)
- **Load in preload()** - Always preload assets before use
- **Use sprite atlases** - For multiple related images
