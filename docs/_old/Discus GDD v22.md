# DISCUS — GAME DESIGN DOCUMENT

### Version 21 (Canonical Draft)
### Canonical Source: This prose document (doc-first). All JSON is derived from here.

**Changelog v20 → v21:**
- **Comprehensive Multiplayer Architecture Expansion** based on Gabriel Gambetta's authoritative series:
  - Enhanced Section 16.1.1: Added detailed explanation of why sequence numbers matter for fast-twitchy gameplay, temporal synchronization mechanics
  - Enhanced Section 16.1.2: Added critical timing diagrams for 250ms RTT scenarios, temporal mismatch problem specific to 60 Hz gameplay
  - **NEW Section 16.1.11: Server Tick Rate vs Snapshot Rate** - Dual-loop architecture (60 Hz sim + 30 Hz broadcast), input queue processing, bandwidth optimization
  - **NEW Section 16.1.12: Reference Resources** - Organized bibliography with direct links to all source materials
  - **NEW Section 16.1.13: Entity Interpolation for Remote Players** - Complete implementation with position buffers, timeline diagrams, remote disc handling
  - **NEW Section 16.1.14: Putting It All Together** - Comprehensive synthesis of all four Gambetta articles applied to DISCUS context, complete timeline diagrams, memory/CPU budgets, common pitfalls checklist
  - Enhanced Section 16.1.15: Expanded testing checklist with 11 new validation criteria, network simulation harness, 5 specific validation scenarios
- Total addition: ~340 lines of implementation-ready multiplayer guidance
- All patterns validated against industry-standard references and adapted for fast-twitchy arena combat with projectiles

**Changelog v19 → v20:**
- Expanded Section 10.2: Added comprehensive industry accessibility guidelines (based on XAG research)
- Reorganized Section 12: Clarified Colyseus built-in vs custom implementation requirements
- **Added Section 16.1: Multiplayer Implementation Reference Library** with:
  - Input sequence numbering and acknowledgment patterns
  - Server reconciliation with input replay (Gabriel Gambetta method)
  - Smooth error correction (4AM Games lerp technique)
  - Fixed timestep determinism requirements
  - Projectile authority and optimistic client feedback
  - State history buffer management
  - Floating point epsilon tolerance
  - Colyseus + Phaser integration patterns
  - Timed events during reconciliation
  - Bandwidth optimization strategies
  - Complete code examples and implementation priorities
- Enhanced Section 11.5: Added 10 new multiplayer-specific tunables
- Enhanced Section 12.2: Detailed message format specifications with TypeScript types
- **Added Section 18: Sources & References** - Comprehensive bibliography of all research sources used

## 1) METADATA & PURPOSE

**Title:** Discus

**Status:** In Progress (living document)

**Genre:** 2D top-down arena action (arcade-speed)

**Engine:** Phaser 4 (web-first), Node.js (server), Colyseus (authoritative multiplayer)

**Packaging:** Electron desktop build (Windows/macOS; Linux optional)

**Rendering:** WebGL (Canvas fallback) — **2D "sprite" atlas-based game**

**Input:** KB/M + Gamepad (Gamepad API); **Arcade Mode** = gamepad-only

**Testing Runtime:** Chrome (desktop); parity with Electron (Chromium)

**Purpose of this Document**

This is the **human-readable, canonical** design & production spec. It preserves **creative intent** and **technical implementation details** in nuanced prose. All structured formats (LLM JSON, summaries, exports) are **derived from this doc** and never replace it.

**Target Audience (Players)**

Players who enjoy classic arcade games, multiplayer team-based and deathmatch-style competition, and easy-to-watch gameplay suitable for streaming on Twitch. 

- **Casual Players:** Ages 12 and up seeking accessible, pick-up-and-play action with clear visual feedback and straightforward mechanics.
- **Competitive Players:** Ages 16 to late 30s looking for skill-based gameplay with perfect timing windows, team coordination, and high-level strategic depth.
- **Spectators/Streamers:** Fast-paced matches with clear visual communication make for engaging content and tournament play.

**Development Team Audience**

Designers, TypeScript/Node engineers, sprite artists, technical artists (shaders), audio, QA, community, and future LLM assistants.

## 2) PROJECT GOALS

### 2.1 High Concept (One-liner)

Hurl electrified discs at opponents in lightning-fast team battles where split-second timing decides who walks away and who disintegrates into the grid.

### 2.2 Core Pillars

1. **Readability First:** Trails, outlines, and damage states communicate instantly.
2. **Arcade Purity:** CPS2-era clarity (1992–2003) — minimal UI, maximal feel.
3. **Authoritative Netcode:** Server decides hits/tags; clients predict only movement.
4. **LLM-Safe Structure:** One mechanic per file; JSON-only tuning.
5. **Accessibility Baseline:** Colorblind support, clarity modes, and remapping are core features (Microsoft guidance).

### 2.3 Success Criteria ("Definition of Done")

- Throw/Block/Dodge/Catch/Respawn loops implemented and verified.
- Client/server determinism for collisions & scoring.
- **Colorblind readability** passes complete; palette & outline options shippable.
- **Electron Build = Release Candidate milestone** packaged and QA'd.
- ≥60 FPS (target), ≤120 ms end-to-end input times on reference machines.
- **v1 physics = Arcade (Phaser 4)**; moving to Matter requires an explicit milestone (scope-creep guardrail).
- Spectator Mode & Replay pipeline: operational with **Match Data Recorder**.

### 2.4 Audience & Platforms

- **Primary:** Electron desktop (Windows/macOS).
- **Testing/Dev:** Chrome desktop.
- **Secondary:** Web demo / LAN play.
- **Players:** Competitive & casual PvP; streamers and community tournament organizers.

### 2.5 Business/Commercial (for later)

- Distribution: Steam, itch.io, direct site installer.
- Monetization: cosmetics-only (no pay-to-win).
- Community: Leaderboards, tournaments, Discord, highlight reels via replay export.

## 3) WORLD FLAVOR & THEME (LIGHT)

Vibes echo retro-future grids and energy: bright lanes, electric hazards, floating drones, chrome-and-glow UI. Theme reinforces readability: colors map to teams and clarity modes.

## 4) PRODUCTION PLAN & MILESTONES

### 4.1 Milestones

| Phase | Focus | Definition of Done |
|-------|-------|-------------------|
| **Prototype** | Core movement, Throw/Block/Dodge/Catch, basic arena (squares/circles) | Physics feel locked; debug overlays; single-machine mock match |
| **Alpha** | Colyseus authoritative server, Rooms/Lobby, 4-8 players | Stable 60 Hz sim; snapshots 20–30 Hz; reconciliation proven |
| **Beta** | Menus, customization, accessibility, hazards, Spectator/Replay | Full loop; colorblind mode; Match Data Recorder operational |
| **RC — Electron Build** | Packaging, settings, perf + compat passes | Electron installer; settings manager hooks; QA checklists green |

**Scope Guards**

- Phaser 4 **Arcade** only in v1; **Matter** migration = new milestone.
- "One mechanic per file" and **no DOM/Electron code** inside mechanics.
- All gameplay numbers in **/src/config** JSON with schema.

### 4.2 Workflow, Tools, & Roles

- **Repo**: GitHub; LFS for large art/audio.
- **Build**: Vite (client), electron-builder (packaging).
- **Lang**: TypeScript (client/server).
- **Tracking**: Issues by feature/scene/module; playtest notes weekly.
- **QA**: Headless server tests; latency harness; physics overlay; audio loop validation.
- **Roles**: Design, Programming, Art, Tech Art (shaders), Audio, QA, Community.

### 4.3 Risks & Mitigations

- **Net instability** → server authoritative; client prediction only for movement; reconciliation.
- **Art scope creep** → layered runtime with optional **on-demand compositing**; cache by recipe hash.
- **LLM code sprawl** → strict **agents.md**, per-module ownership, "edit the right file" rules.

### 4.4 Next Steps (Kickoff List)

1. Lock Phaser 4 project skeleton & Arcade config @ 60/120 Hz.
2. Implement **Config Loader** (base/dev/prod + JSON Schema).
3. Build physics debug overlay (tunable colors/widths).
4. Implement **Login → Lobby → Room → Match** flow.
5. Add **Universal FX Creator & Destroyer** hooks.

## 5) GAMEPLAY OVERVIEW

### 5.1 Player Count & Modes

- **Online Multiplayer** (authoritative server; room codes, lists).
- **LAN Multiplayer** (same stack; IP connect; optional discovery).
- **Arcade Mode** (single machine, multiple gamepads; local sim loopback; no network).

### 5.2 Session Length & Flow

- Match Timer governs round (e.g., 3:00 default).
- Score = "disintegrations" of opponents by threatening disc.
- **Mercy End**: early end if lead ≥ threshold (JSON tunable).
- **Sudden Death**: optional tiebreaker (toggle in Options).

### 5.3 Player Journey (Narrative)

Boot → faux "memory check" → publisher logos → **Start Screen** (Local / Multiplayer / Options).

**Local/Arcade path:** 8 "Press Start" prompts; joining anchors a gamepad slot.

Character select (masc/fem; color); timed; CPU picks if timeout.

**Team Select Zones** on the actual grid: stand on areas to join teams; 5th zone = **Free For All (FFA)**; timer locks teams.

Staging (movement on, attacks off) → **Round Start**.

End-of-match: losing teams disintegrate; results & breakdown.

## 6) CORE MECHANICS

**Notation:** Cross-references like [Glossary.Throw], [Glossary.Perfect Block] refer to terms in the Glossary.

### 6.1 Input & Movement

- **8-way** movement (D-pad or stick treated as 8-way).
- Buttons: **Throw**, **Block**, **Dodge**, **Start**.
- Players **body-block** each other; opposing lanes "stall & slide" diagonally.

### 6.2 Discus States & Actions

- [Glossary.Threat Mode] (active kill state) → [Glossary.Inert Mode] (auto-return).
- **Throw**: tap → fire in movement direction; **Charge Throw**: hold to root/aim; release for faster disc.
- **Curve Throw**: brief post-release control window.
- **Catch**: owner collides with disc (any state) to re-arm.
- Threat discs **bounce** off walls and other threat discs (toggleable), reducing Threat Time on impact.

### 6.3 Defense & Mobility

- **Block**: hold to face disc; deflect if facing tolerance passes.
- **Perfect Block**: 3-frame window → disc becomes non-threat and returns to owner.
- **Dodge**: i-frame burst with cooldown; **Perfect Dodge**: 1–2 frames pre-impact (0s extra cooldown).

### 6.4 States & Transitions (Player)

- **SpawnGuard** (invulnerable, slowed, inputs locked) → **Active**.
- **ChargingThrow** (rooted/rotate) → release to emit disc.
- **Blocking** (hold) → **Deflect/Perfect Block** on contact.
- **Diving** (i-frames, speed burst) → cooldown.
- **Stunned** (electric hazards) → **HazardImmunity** tag.
- **Knockback** → **Disintegrated** → **Reintegration** → **SpawnGuard**.
- **Disrupted** (net failure) → removed to Waiting Room with special animation.

**Priority (high→low):** Disrupted > Disintegrated/Reintegration/SpawnGuard > Stunned/Knockback > Diving > Blocking window > ChargingThrow > Active.

### 6.5 Scoring

- 1 point per disintegration (team or FFA).
- Threat-time extensions on successful hits (tunable).
- Mercy End & Sudden Death as Options settings.

**Score State Management (Server Authority):**
- Server maintains authoritative score state in room schema
- Score updates broadcast via dedicated `scoreUpdate` event, not continuous state sync
- Client text objects update on event: `room.onMessage('scoreUpdate', (scores) => { this.updateScoreDisplay(scores); })`
- Prevents score display lag/stutter from general state synchronization delays

## 7) HAZARDS & ARENA DESIGN

### 7.1 Arena Shape & Tiles

- Standard: **rectangular, tile-based** grid.
- Randomized barriers; **outer walls** can open to reveal hazards (events).
- Hooks for future map packs; allow areas larger than screen (camera follow).

### 7.2 Hazards (All JSON-tunable)

- **Regular Wall:** blocks players; normal disc bounce; player_slide_enabled, disc_bounce_coeff.
- **Bouncy Wall/Bumper:** pushes players back; **pushback_iframes_ms**; bounce lively for discs.
- **Electric Wall/Floor:** stuns players (player_stun_ms); **disc_threat_penalty_s**; **post_stun_immunity_ms**.
- **Conveyor Floor:** directional drift; **conveyor_speed_mult**; **against_flow_speed_mult**.
- **Drone (NPC):** 8-dir animation; curved sweeps w/ sudden stops; fixed-length lasers; **on_destroy_threat_extend_s**.

Hazards are **annoyances**, not primary threats — tuned to add tension without overshadowing PvP.

### 7.3 Appearance Clusters

Grouped patterns: floor clumps, wall segments flipping to electrified, synchronized sequences. All data-driven (tile sets + timing JSON).

## 8) CONTENT & CUSTOMIZATION

### 8.1 Characters & Layered Rendering

- **Flipbook sprites** (no skeletal rig).
- Container slots (z-order): back-hair < cape < body < chest < arms < front-hair < accessory.
- Per-animation z-overrides (e.g., run frame 6 arms>chest; frame 7 arms<chest).
- Single-atlas-per-rig (preferably) to minimize swaps; trim + extrude 2–4 px.
- Palette swaps via shader (preferred) or baked variants (same atlas).

**Promotion Path:** layered runtime → optional per-match **composite** (RenderTexture) cached by recipe hash (LRU).

**Performance Optimization for 8-Player Matches:**
- **Sprite Batching:** Single texture atlas per character rig minimizes draw calls
- Target: All 8 players + discs in 2-3 draw calls maximum
- **Texture Packing:** Use TexturePacker or similar to create dense atlases
- **Culling:** Phaser's built-in camera culling handles off-screen players automatically
- **Simplified Remote Players:** Consider lower animation framerates for non-local players (30fps vs 60fps) if performance issues arise
- **Atlas Preloading:** Load all team atlases during lobby/loading, not mid-match

### 8.2 Cosmetic "Recipe" (example shape)

```json
{
  "rig": "humanoidA",
  "slots": { 
    "body": "bodyA", 
    "hair": "hairC", 
    "armor": "armorE", 
    "boots": "bootsB" 
  },
  "palette": "palette_03",
  "animSet": "runner_v2",
  "zOverrides": { 
    "run": { 
      "6": ["arms>chest"], 
      "7": ["arms<chest"] 
    } 
  }
}
```

### 8.3 Audio

- Formats: OGG/Opus for music/SFX; WAV mono for ultra-snappy cues.
- Audio sprites for micro-SFX; music loops seamless (markers).
- Mix groups: music, sfx, ui, voice (separate sliders).
- Announcer VO (arcade style); server join/exit chimes; 5-second timer ticks.

## 9) USER EXPERIENCE (UX)

### 9.1 Readability Goals

- **Disc trails**, team colors, and outlines for clarity.
- **Thick black outline** option for colorblind modes.
- Team color is a costume element that **cannot be changed** (except FFA palette alignment).

### 9.2 Menus & Flow (Data-Driven)

- **Main Menu:** Online, LAN, Arcade, Options.
- **Online:** create/join by room code/IP; browse live list.
- **LAN:** mirrors online; local IPs.
- **Arcade:** attract mode (8 press-start slots); JSON option to force cabinet mode.
- **Options:** remap, accessibility (Microsoft baseline), audio sliders, gameplay toggles (team pass-through, threaten duration), net/server settings, **reset defaults (from JSON)**.

### 9.3 HUD & Main Game Screen (Screen Composition)

- The **game grid** (arena) sits inside an outer wall.
- Scores/timer/round status **live within the wall width** (diegetic frame).
- Hazards appear on the grid; characters run & throw inside the inner area.

### 9.4 Physics Debug View (Data-Driven)

**/src/config/physicsDebug.json** (example):

```json
{
  "enabled": true,
  "lineWidthPx": 2,
  "alpha": 1.0,
  "colors": {
    "player": "#FFD400",
    "discus": "#FF00FF",
    "rayline": "#FF00FF",
    "walls": "#00FFFF",
    "hazards": "#FF7A00"
  }
}
```

Owner overlay may draw a rayline for discus direction. Toggleable at runtime; hot-reload if JSON changes.

### 9.5 Spectator & Replay (UX)

- **Spectator:** join server in read-only mode; server sends delayed feed (tunable).
- **Replay:** saved match streams (.replay) from authoritative events/snapshots; UI for browsing & playback.

## 10) ACCESSIBILITY & INCLUSIVITY

### 10.1 Colorblind & Readability (Core Requirement)

- Colorblind palettes (CVD-safe sets) and thick outline toggle.
- Team colors locked per team item; FFA uses personal palette.
- Long-press Start (5s) to force colorblind preset in-match.

### 10.2 Accessibility Implementation Guidelines

Industry best practices developed with gaming experts and the Gaming & Disability Community, intended as design catalysts, development guardrails, and validation checklists to ensure games are enjoyable and playable for everyone.

**Core Guidelines for Discus:**

**Text Display**
- Minimum default text sizes and spacing; configurable style and color options for players with low vision.
- All UI text (labels, prompts, HUD) must meet minimum size requirements and use clear fonts.
- Black outlines on text for visibility against varied backgrounds.

**Contrast**
- Sufficient contrast between text/images and backgrounds for players with color vision deficiencies or low vision, with specific minimum color contrast ratios.
- Team colors and disc trails must maintain accessibility across colorblind modes.

**Screen Narration**
- All on-screen visual information represented aurally through screen narration for players who are blind, have low vision, or learning disabilities.
- Menu navigation, game state changes, and critical events should support narration.
- Interactive elements should enumerate type, state, and position (e.g., "Music Volume, slider, 52%, 6 of 9").

**Input**
- Full button remapping for all actions (Throw, Block, Dodge, Start).
- Support for multiple input methods (keyboard/mouse, gamepad).
- Configurable hold times, toggle vs hold options for sustained actions.

**Difficulty & Gameplay**
- Multiple difficulty options so all players can enjoy games regardless of skill level; ability to change difficulty without losing progress; manual and auto-save options.
- Discus implements this through tunable match parameters (Threat Time, Perfect Windows, cooldowns).

**Time Limits**
- Players need adequate time to read, interpret, and interact with UI; time limits should be adjustable or provide extension options for players with disabilities.
- Match timers and team select countdowns should have configurable durations.
- Idle timeouts should be generous or disableable.

**Visual Distractions & Motion**
- Reduced motion options for players sensitive to motion sickness.
- Screen shake and camera effects should be toggleable.
- Avoid rapid flashing that could trigger seizures.

**Photosensitivity**
- Games should not include images that might cause seizures or migraines; avoid flashes exceeding three per second, high-contrast flashing covering 20% of screen, or extended low-intensity flashing.
- Electric hazard and hit effects must be tested against these thresholds.

**Communication**
- Players with disabilities must be able to navigate to, configure, and use communication features; the entire pathway from launch to communication should be accessible.
- Lobby chat and team coordination features require accessible UI paths.

**Documentation**
- Accessibility features should be documented on accessible websites (WCAG 2 Level AA); use person-first language ("gamers with disabilities") rather than outdated terms like "handicapped."
- In-game help systems must follow accessibility guidelines.

**Mental Health**
- Content warnings for material that may impact mental health; customization options to avoid sensitive content; avoid stigmatized portrayals of characters with mental health conditions.

**Implementation Priorities for Discus:**
- Audio cues for critical states (low timer ticks, stun onset/clear, disintegration warnings).
- Defaults must be playable without configuration; all options easily discoverable.
- Settings accessible at any time without losing match progress.
- Colorblind modes functional in every build (not optional post-launch feature).

## 11) TECHNICAL FOUNDATION

### 11.1 Engine & Physics (Phaser 4)

- Arcade Physics (discrete solver) for v1; circle disc + rect player.
- Time step: fixed 60–120 Hz; tighter steps reduce tunneling risk.
- Manual CCD on Discus only: swept line vs rects/tiles between frames; reflect on hit; skin offset to prevent re-collision loops.
- Tile bias 16–24 if using tilemaps to reduce edge jitter.

**Phaser-Specific Multiplayer Patterns:**

**Player Management with Groups:**
- Use `this.physics.add.group()` for managing all remote players as a single unit
- Enables batch collision checks and simplified lifecycle management
- Example: `this.otherPlayers = this.add.group()` for all non-local players
- Groups allow efficient iteration and culling

**Background Play (Critical for Multiplayer):**
- Enable `game.stage.disableVisibilityChange = true` in game config
- Keeps game updating when browser tab loses focus
- Essential: other players continue moving even when player tabs out
- Without this, returning to tab causes jarring "teleportation" of other players

**Smooth Position Corrections with Tweens:**
- Use Phaser tweens to smooth server position corrections for remote players
- Instead of: `player.x = serverX` (jarring snap)
- Use: `this.tweens.add({ targets: player, x: serverX, y: serverY, duration: 50, ease: 'Linear' })`
- Critical for masking network jitter and prediction errors
- Local player should NOT use tweens (needs instant feedback)

**Object Pooling for Projectiles:**
- Create pool of disc sprites at scene start: `this.discPool = this.add.group({ maxSize: 16, runChildUpdate: true })`
- Reuse sprites instead of create/destroy (reduces GC pressure)
- For 8 players with 1 disc each = 8 active, but pool 16 for safety
- Enable/disable sprites instead of adding/removing from scene

### 11.2 Electron Packaging & Parity

- Same renderer code in Electron; main process handles OS (saves, dialogs) via IPC.
- Validate timers, focus throttling, and GPU blacklists across machines.

### 11.3 Networking Stack (Authoritative)

- Node.js + Colyseus @ 60 Hz tick; snapshots 20–30 Hz; interpolation buffer ~100–140 ms.
- Inputs only from clients; server owns discs, tags, scores.
- Latency compensation for perfect windows (+2 frames configurable; hard cap 5).

### 11.4 Data Layout & Config Loader

**/src/config/**
- Base.json (defaults), dev.json, prod.json, palettes.json, arenas/*.json, schema.json (validation).
- Config.ts merges & hot-reloads.
- Gameplay Master JSON: timers/frames/speeds/stocks/palettes only (no analytics).
- Telemetry JSON: discs_thrown, disintegrations, playtime, heatmaps, geo (opt-in/anon).

### 11.5 Tunables (Defaults; 60 Hz reference)

**Gameplay Mechanics:**
- **Threatening_duration_s:** 5.0 (2–8)
- **Threat_extend_on_hit_s:** 0.75 (0–2)
- **Nonthreat_return_mode:** "until_owner_contact_or_auto-return"
- **Spawn_invulnerability_s:** 3.0 (1–5)
- **Dodge_iframes_frames:** 3 (1–6)
- **Dodge_cooldown_s:** 10.0 (2–20)
- **Perfect_dodge_cooldown_s:** 0.0 (0–5)
- **Perfect_block_window_frames:** 3 (2–5)
- **Latency_comp_frames_perfect:** 2 (0–4; hard cap total 5)
- **Frame_to_ms** = 1000 / tick_hz

**Multiplayer & Netcode (see Section 16.1 for implementation details):**
- **Client_input_history_frames:** 20 (10–30) — How many past input frames to store for reconciliation
- **Max_expected_rtt_ms:** 500 (100–1000) — Worst-case round-trip time for buffer sizing
- **Input_send_rate_hz:** 60 (30–120) — How often client sends inputs to server
- **Reconciliation_epsilon_position:** 0.001 (0.0001–0.01) — Floating point tolerance for position matching
- **Reconciliation_epsilon_velocity:** 0.01 (0.001–0.1) — Floating point tolerance for velocity matching
- **Error_correction_duration_s:** 0.25 (0.1–0.5) — How long to lerp display position to true position
- **Error_correction_lerp_weight:** 0.65 (0.5–0.8) — Lerp factor for error smoothing (higher = slower)
- **Snapshot_rate_hz:** 30 (20–60) — How often server sends world state snapshots
- **Interpolation_buffer_ms:** 120 (50–200) — Client-side buffer for smoothing remote entities
- **Max_input_history_ms:** 2000 (1000–5000) — Auto-cleanup threshold for old inputs

### 11.6 Universal FX (Creator/Destroyer)

- **FX Creator:** centralized factory for trails, glows, hit flashes, screen shake.
- **FX Destroyer:** pooled cleanup, interrupt-safe teardown, scene lifecycle aware.
- All configurable (JSON): durations, colors, intensities.
- Phaser 4 FX pipelines preferred; fallback atlas animations available.

### 11.7 Settings Manager App (External)

- Separate UI app to manage gameplay, network, display, audio, accessibility settings.
- Main game exposes hooks/IPC to read/write current profile; LLM leaves integration points.

### 11.8 Repository Shape (LLM-safe)

```
/src
  /app (boot)
  /scenes (GameScene, LobbyScene, etc.)
  /core (EventBus, Time, Config)
  /mechanics (Movement, Dash, Throw, Disc, Curve, Parry, Catch, Bounce, Scoring, Respawn)
  /net (ClientNet)
  /ui (Hud; /dom: lobby.html, styles.css)
  /config (base.json, dev.json, prod.json, palettes.json, arenas/, schema.json)
  /render (avatars; optional composite cache)
  /fx (creator, destroyer)
/server
  /rooms (LobbyRoom, MatchRoom)
  /services (MatchDataRecorder, AtlasBuilder, ManifestStore)
  /sim (headless tests; latency harness)
  /matchmaker (Gateway)
  /shared (schemas, protocol)
/tools (settings manager)
/build (vite, electron-builder)
```

## 12) MULTIPLAYER & NETWORKING

### 12.1 Room Topology

**Architecture:**
- **Gateway/Matchmaker** → routes to **LobbyRoom** or existing **MatchRoom**.
- **LobbyRoom** (20–30 Hz light sim): presence, chat, recipes, asset manifests.
- **MatchRoom** (60 Hz authoritative): gameplay, collisions, scoring.

**Colyseus Built-In Features Used:**
- Matchmaker API with `.filterBy()` for room options (game mode, skill level, etc.)
- Automatic room creation on demand via `gameServer.define()`
- `maxClients` property for room capacity
- `onJoin()` / `onLeave()` lifecycle hooks
- Room locking/unlocking based on capacity
- `onDispose()` for cleanup when empty

**Custom Implementation Required:**
- Mid-round join blocking: check game phase in `requestJoin()`, return false if match in progress
- Waiting Room holding pattern: separate room instance or "spectator" state within MatchRoom
- Match token generation and error logging system

**Join Rules:**
- Matches do **not** admit new players mid-round (wait in Waiting Room).
- Desync/disruption triggers **Disrupted** animation → removal to Waiting Room.
- Rooms cleaned on empty; errors logged with match tokens.

### 12.2 Messages (LLM-friendly JSON)

**Client → Server**

```typescript
// Join room
join { 
  roomCode: string, 
  name: string, 
  clientVersion: string 
}

// Input frames (CRITICAL: includes sequence number for reconciliation)
input {
  seq: number,              // Sequential input ID (incrementing per input)
  timestamp: number,        // Client timestamp (ms since epoch)
  move: [x, y],            // Normalized movement vector (-1 to 1)
  aim: [x, y],             // Aim direction (normalized or world coords)
  buttons: {
    throw: boolean,
    block: boolean,
    dodge: boolean
  }
}

// Batched inputs (bandwidth optimization - see Section 16.1.10)
inputBatch {
  frames: [
    { seq, timestamp, move, aim, buttons },
    { seq, timestamp, move, aim, buttons },
    ...
  ]
}

// Set player cosmetics
set_recipe { 
  rig: string, 
  slots: { body, hair, armor, boots }, 
  palette: string, 
  animSet: string 
}

// Chat message
chat { 
  channel: string, 
  text: string 
}

// Client asset loading complete
assets_ready { 
  version: string, 
  hashes: string[] 
}
```

**Server → Client**

```typescript
// World state snapshot (sent at snapshot_rate_hz, typically 20-30 Hz)
snapshot {
  serverTick: number,           // Authoritative server tick count
  ackInputSeq: number,          // Last processed input sequence from this client
  timestamp: number,            // Server timestamp
  entities: {
    players: [
      { 
        sessionId: string, 
        x: number, 
        y: number, 
        velocityX: number,
        velocityY: number,
        state: string,            // "active" | "blocking" | "dodging" | "stunned"
        health: number,
        facingAngle: number
      }
    ],
    discs: [
      { 
        id: string, 
        ownerId: string,
        x: number, 
        y: number, 
        velocityX: number,
        velocityY: number,
        isThreat: boolean,
        threatTimeRemaining: number
      }
    ]
  },
  events: [
    // Discrete events that happened this tick
    { type: "discHit", discId, victimId, damage, position },
    { type: "playerDisintegrated", playerId, killerId },
    { type: "perfectBlock", blockerId, discId }
  ]
}

// Standalone event (high-priority, sent immediately)
event { 
  id: string,
  kind: string,              // "discHit" | "playerKilled" | "scoreUpdate"
  payload: object,           // Event-specific data
  serverTick: number
}

// Score update (dedicated channel - see Section 6.5)
scoreUpdate {
  scores: { [teamId: string]: number },
  serverTick: number
}

// Asset manifest
manifest { 
  version: string, 
  manifestUrl: string, 
  hashes: string[] 
}

// Room metadata update
room_update { 
  phase: string,             // "lobby" | "team_select" | "staging" | "active" | "results"
  timeRemaining: number,
  playerCount: number
}
```

**Message Flow Diagram:**

```
Client                          Server
  |                               |
  |--- input (seq: 100) --------->|
  |--- input (seq: 101) --------->| Process inputs
  |--- input (seq: 102) --------->| Update physics (60 Hz)
  |                               | 
  |<-- snapshot (ack: 100) -------|  (sent at 30 Hz)
  |                               |
  |   [Reconciliation:            |
  |    - Accept server state      |
  |    - Replay inputs 101-102]   |
  |                               |
  |--- input (seq: 103) --------->|
  |<-- snapshot (ack: 102) -------|
```

**Implementation Notes:**
- **Server Tick:** 60 Hz simulation. **Snapshots:** 20–30 Hz (configurable).
- **Interpolation Buffer:** Client buffers ~100-140 ms for smooth remote player rendering.
- **Anti-Cheat:** Server validates all inputs (movement caps, cooldowns, ownership).
- **Sequence Numbers:** Essential for reconciliation (see Section 16.1.1).
- **Batching:** Optional for bandwidth optimization (see Section 16.1.10).

### 12.3 Spectator Mode (Delay & Integrity)

**Custom Implementation Required:**
- Spectators join room in special "observer" mode (custom client flag)
- Server buffers snapshots/events and delays transmission by **N ms** (tunable)
- Spectators receive same snapshot format but time-shifted
- Larger interpolation buffer client-side to smooth delayed view
- UI clearly labeled **Spectator** with delay indicator

**Colyseus Foundation:**
- Clients can connect to same room with different roles (standard pattern)
- `client.userData` can store spectator flag
- Room can track spectators separately from active players
- `room.send(client, data)` for targeted messages to specific clients

**Implementation Pattern:**
```typescript
// In MatchRoom
onJoin(client, options) {
  if (options.spectator === true) {
    client.userData.isSpectator = true;
    // Add to spectator list, don't create player entity
  }
}

// In update loop
if (shouldBroadcastSnapshot) {
  // Send immediate to players
  this.clients.forEach(client => {
    if (!client.userData.isSpectator) {
      this.send(client, currentSnapshot);
    }
  });
  
  // Buffer for spectators (custom delay queue)
  this.spectatorBuffer.push({ 
    snapshot: currentSnapshot, 
    sendAt: Date.now() + this.spectatorDelayMs 
  });
}
```

**Cannot Affect Gameplay:**
- Spectator inputs ignored by server
- Read-only state access

### 12.4 Replay System

**Custom Implementation Required (High Complexity):**

The replay system must be built entirely from scratch. Colyseus provides the foundation but no built-in replay functionality.

**Core Components to Build:**
- **Match Data Recorder** service that captures authoritative event stream
- Snapshot capture system (piggyback on `onBeforePatch()` or simulation loop)
- Event logger for all gameplay events (hits, deaths, spawns, etc.)
- Optional input recording for deterministic replay
- File serialization format (`.replay` files)
- Compression and optimization for file size
- File I/O integration (use `onDispose()` hook for final write)

**Replay Data Structure:**
- Match seed and configuration
- Timestamped snapshots at key intervals
- All gameplay events with server ticks
- Optional: input buffer for deterministic resimulation
- Atlas/asset manifest by hash for visual consistency

**Playback Requirements:**
- Clients must load identical atlases by hash
- Deterministic resimulation OR snapshot-based playback
- UI for browsing stored replays
- Timeline scrubbing and playback controls
- Camera control during replay

**Colyseus Hooks for Implementation:**
- `onBeforePatch()` - capture state before each snapshot broadcast
- `clock.currentTime` / `clock.elapsedTime` - timestamp events
- `onDispose()` - persist recorded data when match ends
- Room state schema - provides structure for snapshots

**Storage:**
- Export/import `.replay` files
- Electron can open from file menu via IPC
- Consider streaming for live replay (separate socket connection)

### 12.5 Shared "Match Data Recorder" Service

**Custom Service Architecture:**

One unified service handles **both** live Spectator feeds (delayed) and on-disk Replay writing. This avoids code duplication and drift.

**Components:**
- Single serialization pipeline for events/snapshots
- Mode switch: `liveDelayed` (stream to spectators) vs `fileWrite` (disk storage)
- Guarantees identical event ordering & hashing across both modes
- Buffer management for time-delayed spectator streaming

**Colyseus Integration Points:**
- Hook into room's update loop and `onBeforePatch()`
- Subscribe to custom events for game actions
- Use `onDispose()` to flush final replay data to disk

**Implementation Pattern:**
```typescript
class MatchDataRecorder {
  constructor(mode: 'liveDelayed' | 'fileWrite') { }
  
  recordSnapshot(tick: number, state: any) { }
  recordEvent(tick: number, event: any) { }
  
  // For live spectators
  getDelayedData(delayMs: number): SnapshotEvent[] { }
  
  // For file replay
  serialize(): Buffer { }
  writeToFile(path: string): Promise<void> { }
}
```

**Benefits:**
- Single code path for recording logic
- Consistent data format
- Easy to add replay export without affecting spectator mode
- Shared compression and optimization

### 12.6 Fighting-Game Informed Practices

**Custom Implementation Required:**

These patterns are inspired by fighting games but must be built on top of Colyseus's foundation.

**Perfect Windows (3-frame tolerance):**
- 3 frames (vs SF6's 2) for gentler feel
- Server applies **latency compensation** +2 frames (configurable; hard cap total 5)
- **Implementation:** Server timestamps inputs, validates against window with ping offset
- Colyseus provides: `client.userData` for storing latency, custom validation in `onMessage()`

**Reversal Buffer-like Logic:**
- After respawn/hitstun states, slightly larger input buffer restores responsiveness
- **Implementation:** Queue inputs during locked states, process on state exit
- Colyseus provides: State machine framework via Schema, message queuing

**Client-Server Reconciliation:**
- Client predicts own movement only
- Server sends authoritative position
- Client reconciles (snaps to server truth + replays unacknowledged inputs)
- **Implementation:** Use patterns from Section 16.1 Priority 1
- Colyseus provides: State synchronization handles corrections automatically

**Optimistic Client Feedback (Feel Enhancement):**
- Client shows immediate visual/audio feedback for actions before server confirms
- Example: Disc collision → client plays impact FX and particle burst immediately
- Server confirms 50-100ms later → if wrong, client corrects silently
- Pattern: `onDiscThrow() { playThrowAnimation(); playThrowSound(); sendInputToServer(); }`
- Server event confirms or corrects: `onServerEvent('discHit') { if (!alreadyShown) showImpact(); }`
- Makes 60-100ms network latency imperceptible to players
- Critical for maintaining arcade-speed feel over network

**Achievable Patterns:**
- Input buffering and delayed execution (custom)
- Server-side input validation with latency windows (custom)
- Client-side movement prediction + server reconciliation (Colyseus + custom)
- State snapshots for correction (Colyseus built-in)
- Optimistic client feedback for impacts and actions (custom)

## 13) DESIGN & LAYOUT — SCREENS

Use 🛂 sections as placeholders for visual mockups later. All screens are data-driven and modular.

### 13.1 Screen Index

- **Boot & Logos** — Classic arcade boot sequence (~30 seconds total):
  - **Phase 1 (0-10s):** Classic arcade screen check pattern
    - Horizontal/vertical bars sweep across screen
    - RGB color cycling test patterns
    - Checkerboard pattern flash
    - Audio: High-pitched beep sequence
  - **Phase 2 (10-20s):** Faked memory checks
    - Scrolling hexadecimal values (0x0000 → 0xFFFF style)
    - "CHECKING RAM... OK" style messages
    - Progress bars filling rapidly
    - Retro green/amber monochrome text aesthetic
    - Audio: Satisfying electronic chirps/clicks
  - **Phase 3 (20-25s):** Title card
    - Black screen fade-in
    - **"DISCUS"** title appears (bold, glowing)
    - Build date displayed below (e.g., "BUILD 2025.10.23")
    - Optional: Version number (e.g., "v0.1.0-alpha")
    - Audio: Deep bass hum/impact sound
  - **Phase 4 (25-30s):** Publisher logo animations
    - Sequence of publisher/studio logos
    - Each logo: 2-3 second animation + 1 second hold
    - Audio: Individual logo stingers/sounds
  - **Skip:** Press any button to skip entire sequence
  - **Config:** `/src/config/boot.json` controls timings, enable/disable phases, skip behavior

- **Start Screen** — Environment-dependent behavior:
  - **Arcade Mode OFF** (env var `ARCADE_MODE=false` or not set):
    - Traditional menu screen appears immediately after boot
    - Shows static **"DISCUS"** logo at top
    - Menu options listed below:
      - Local / Multiplayer (split option)
      - Multiplayer
      - Options
      - Exit (desktop only)
    - Keyboard/mouse navigation enabled
    - **Config:** `/src/config/startScreen.json`
  - **Arcade Mode ON** (env var `ARCADE_MODE=true`):
    - **Attract sequence:**
      - "DISCUS" logo fades in from bottom
      - Logo scrolls upward smoothly (2-3 second animation)
      - Logo lands/locks in center of screen with impact effect
      - Audio: Whoosh + bass thump on landing
      - Menu options fade in below logo after 0.5s delay
    - Menu options:
      - **START** (primary, glowing/pulsing)
      - Press Start prompt for each player slot (1-8)
    - Gamepad-only navigation (no keyboard/mouse)
    - **Idle behavior:** After 30s of inactivity, transition to attract mode (gameplay demo loop)
    - **Config:** `/src/config/arcadeMode.json`
  - **Common elements both modes:**
    - Background: Subtle animated grid or energy pattern
    - Audio: Looping ambient music (low-intensity)
    - Version number in corner (small, unobtrusive)

- **Lobby / Waiting Room** — Non-arcade multiplayer modes only:
  - **Purpose:** Pre-match holding area when player joins a server
  - **Player Representation:**
    - Full character sprite (same as in-game)
    - Player name displayed below character (configurable color/font)
    - Cosmetic recipe applied (showing selected customization)
  - **Movement:**
    - Full 8-way movement enabled (same controls as gameplay)
    - Players can walk around freely within lobby bounds
    - Body-blocking enabled (players collide with each other)
    - No attacks/throws/abilities active
  - **Social Features:**
    - **Emotes:** Button input triggers character animation
      - Wave, cheer, taunt, dance, etc.
      - Visual: Character performs animation
      - Audio: Short sound effect per emote
      - Cooldown: 2-3 seconds between emotes (prevent spam)
    - **Canned Messages:** Pre-defined text phrases
      - Accessed via radial menu or quick-select wheel
      - Example messages: "Ready!", "Let's go!", "GG", "Wait for me", etc.
      - Visual: Speech bubble appears above player's head
      - Bubble duration: 3-5 seconds (fades out)
      - Font: Clear, readable, with character outline
      - Color: Team color or neutral white
      - **Config:** `/src/config/cannedMessages.json` for phrase list
  - **UI Elements:**
    - **Player list:** Sidebar showing all connected players (names, ready status)
    - **Room info:** Server name, game mode, map name at top
    - **Ready button:** Toggle ready status (checkmark appears by name)
    - **Chat window:** Optional text chat for keyboard users (can be disabled)
    - **Timer:** Optional countdown until match start (if host sets timer)
  - **Match Transition:**
    - When all players ready OR host starts OR timer expires
    - Screen wipes/fades to Team Select screen
    - Audio: Transition sound effect
  - **Background:**
    - Static or subtly animated arena environment
    - Non-distracting, allows focus on social interaction
  - **Network:**
    - Connected to LobbyRoom (Colyseus)
    - Low-frequency updates (10-20 Hz sufficient)
    - Movement not latency-sensitive (no prediction needed)
  - **Accessibility:**
    - Speech bubbles use accessible fonts and contrast
    - Colorblind-safe message colors
    - Screen reader support for player list and chat
  - **Config:** `/src/config/lobby.json` controls room size, emote list, message duration

- 🛂 **Team Select on Grid** (zones: team1–4 + FFA)
- 🛂 **Staging** (movement on, attacks off)
- 🛂 **Main Game Screen** (grid inside wall; HUD within wall width)
- 🛂 **Results / Breakdown** (scores, disintegrations, highlights)
- 🛂 **Options** (remap, accessibility, audio, gameplay, network)
- 🛂 **Spectator View** (delay indicator, follow player/team)
- 🛂 **Replay Browser & Player** (timeline scrub, camera controls)

## 14) OPTIONS — SCORE & GAME TIME

- **Match Duration** (timer).
- **Mercy Threshold** (point lead).
- **Sudden Death** (on/off).
- **Reset to Defaults** pulls from config baseline.
- Emphasize **small files** and "domain per file" construction for LLM stability.

## 15) GLOSSARY (CANON)

### Player Actions & States

- **Throw** — basic disc release in movement direction.
- **Charge Throw** — hold throw to power up and aim.
- **Curve Throw** — brief post-release influence over disc path.
- **Block** — held action; deflects if facing correctly.
- **Perfect Block** — 3-frame window; nullifies threat and returns disc.
- **Dodge** — i-frame burst; prevents pass-through.
- **Perfect Dodge** — 1–2 frames before impact; enhanced evasion (0s extra CD).
- **Dodge Cooldown** — time before next dodge.
- **Respawn** — return after disintegration; short invulnerability.
- **Win/Lose Pose** — post-match animations.
- **Taunt Pose** — Start tap triggers taunt; **resets dodge timer** but locks inputs (vulnerable).
- **Disrupted Pose** — animation when net integrity fails before removal.

### Discus States & Rules

- **Threat Mode** — active; disintegrates opponents.
- **Inert Mode** — returning; passes through everything to owner.
- **Threat Time** — duration of threat; extends on hit (tunable).
- **Bounce** — reflections off walls/objects/threat discs (toggle).
- **Deflection** — block-caused direction change.
- **Catch** — owner contact to recover disc.
- **Stock** — future power-up allowing multiple discs.

### Match & Scoring

- **Point** — awarded on disintegration.
- **Mercy End** — early end at lead threshold.
- **Sudden Death** — tiebreaker mode.
- **Match Timer** — governs round duration.
- **Win/Lose/Tie** — outcomes at time or sudden death rule.

### Hazards & Environment

- **Regular Wall** — blocks players; normal disc bounce.
- **Bouncy Wall/Bumper** — pushes players back; lively disc bounce.
- **Electric Wall/Floor** — stuns players; shortens disc threat time.
- **Conveyor Belt Floor** — forced movement.
- **Drone** — flying NPC; curved sweeps; fixed-length lasers.
- **Hazard Clusters** — grouped patterns.
- **Dynamic Walls** — edges open to hazards.

### Menus & Modes

- **Arcade Mode** — couch/co-op with 8 gamepads; attract style.
- **LAN Multiplayer** — local network rooms.
- **Online Multiplayer** — internet rooms with lobby staging.
- **Waiting Room** — lobby where players move/chat before match.
- **Team Select Zones** — stand-to-choose teams; 5th zone for **FFA**.
- **Free For All (FFA)** — individual scoring; no teams.

## 16) LLM DEVELOPMENT GUIDANCE & GUARDRAILS

### 16.1 Multiplayer Implementation Reference Library

This section consolidates critical multiplayer patterns, code examples, and implementation priorities derived from industry research (Gabriel Gambetta, 4AM Games, Colyseus official tutorials) and fighting-game netcode practices. Use this as a practical reference when implementing the authoritative server architecture described in Section 12.

#### Implementation Priority Levels

**Priority 1 (Alpha Milestone - Core Netcode):**
- Input sequence numbering and acknowledgment
- Fixed timestep determinism
- Client prediction for local player movement
- Server reconciliation with input replay
- Basic remote player interpolation

**Priority 2 (Beta Milestone - Feel & Polish):**
- Smooth error correction (lerp to true position)
- Optimistic client feedback for actions
- Projectile authority and hit detection
- State history buffer management
- Floating point epsilon tolerance

**Priority 3 (Post-Beta - Advanced):**
- Advanced interpolation techniques
- Bandwidth optimization (input batching)
- Latency hiding for timed events
- Jitter compensation
- Adaptive snapshot rates

---

#### 16.1.1 Input Sequence Numbers & Acknowledgment (Priority 1)

**Problem:** Without sequence numbers, client cannot know which inputs server has processed, breaking reconciliation.

**Solution:** Attach incrementing sequence number to every input frame; server echoes last processed sequence in snapshots.

**Why This Matters for DISCUS:**
In fast-paced games, the gap between predicted state and server state can grow quickly. Without sequence numbers, the client has no way to know which of its predictions have been validated by the server. This leads to:
- Inability to reconcile mismatches between client prediction and server authority
- Retention of stale input data indefinitely (memory leak)
- False corrections when server state arrives (character "teleporting" backward/forward)

The sequence number acts as a synchronization point - when server says "I processed up to input #47", the client knows it can discard inputs #1-47 and only needs to replay #48+ during reconciliation.

**Implementation Pattern:**

```typescript
// Client: src/net/ClientNet.ts
class ClientInputManager {
  private inputSequence = 0;
  private pendingInputs: Map<number, InputState> = new Map();
  
  sendInput(move: Vec2, aim: Vec2, buttons: ButtonState) {
    const input: InputFrame = {
      seq: this.inputSequence++,
      timestamp: Date.now(),
      move: [move.x, move.y],
      aim: [aim.x, aim.y],
      buttons: {
        throw: buttons.throw,
        block: buttons.block,
        dodge: buttons.dodge
      }
    };
    
    // Store for reconciliation
    this.pendingInputs.set(input.seq, input);
    
    // Send to server
    this.room.send('input', input);
    
    // Apply immediately (client prediction)
    this.applyInput(input);
  }
  
  onServerSnapshot(snapshot: ServerSnapshot) {
    const lastProcessedSeq = snapshot.ackInputSeq;
    
    // Discard acknowledged inputs
    for (const [seq, input] of this.pendingInputs) {
      if (seq <= lastProcessedSeq) {
        this.pendingInputs.delete(seq);
      }
    }
    
    // Reconcile (see 16.1.2)
    this.reconcile(snapshot);
  }
}
```

**Message Format Enhancement (Section 12.2):**

```typescript
// Client → Server (enhanced)
{
  type: 'input',
  seq: number,           // NEW: Sequential input ID
  timestamp: number,     // Client timestamp
  move: [x, y],
  aim: [x, y],
  buttons: { throw, block, dodge }
}

// Server → Client (enhanced)
{
  type: 'snapshot',
  serverTick: number,
  ackInputSeq: number,   // NEW: Last processed input sequence
  entities: { players[], discs[] },
  events: []
}
```

**Configuration (add to Section 11.5):**

```json
{
  "client_input_history_frames": 20,
  "max_input_history_ms": 2000,
  "input_send_rate_hz": 60
}
```

---

#### 16.1.2 Server Reconciliation with Input Replay (Priority 1)

**Problem:** Server state lags behind client prediction. Naively accepting server state causes jarring jumps backward.

**Solution:** Accept server state as truth, then replay unacknowledged inputs to fast-forward to "present."

**The Core Issue - Temporal Mismatch:**
When playing DISCUS with 250ms round-trip time (RTT), the timeline looks like this:
- **t=0ms:** Client predicts throw, shows disc immediately
- **t=125ms:** Server receives throw input, processes it
- **t=250ms:** Client receives server confirmation

At t=250ms, the server is telling the client about game state from t=125ms (the past), but the client has already predicted ahead to t=250ms (the present). Simply accepting server position would cause the disc to "jump backward" 125ms, then forward again when the next update arrives.

**Why Replay Works:**
Server state represents "the truth at time T". Unacknowledged inputs represent "what happened after time T". By replaying those inputs on top of server truth, we reconstruct "the truth at present time".

**Critical for DISCUS:**
With 8 players throwing discs simultaneously at 60 Hz input rate, you might have 8-15 unacknowledged inputs per snapshot (250ms RTT ÷ 16.66ms per input). Without replay, each snapshot would cause visible position corrections.

**Implementation Pattern:**

```typescript
// Client: src/mechanics/Movement.ts or src/net/Reconciliation.ts
class ClientReconciliation {
  reconcile(snapshot: ServerSnapshot) {
    const player = this.localPlayer;
    
    // 1. Accept server state as authoritative truth
    player.setServerPosition(snapshot.position.x, snapshot.position.y);
    player.velocity.set(snapshot.velocity.x, snapshot.velocity.y);
    
    // 2. Replay unacknowledged inputs
    const unacknowledged = this.getUnacknowledgedInputs(snapshot.ackInputSeq);
    
    for (const input of unacknowledged) {
      // Re-apply input to calculate current predicted position
      this.applyInput(input, player);
    }
    
    // 3. Check for mismatch (see 16.1.3 for smoothing)
    const predictedPos = player.position.clone();
    const errorMagnitude = Phaser.Math.Distance.Between(
      predictedPos.x, predictedPos.y,
      player.serverPosition.x, player.serverPosition.y
    );
    
    if (errorMagnitude > this.EPSILON) {
      this.triggerErrorCorrection(predictedPos, player.serverPosition);
    }
  }
  
  private getUnacknowledgedInputs(lastAcked: number): InputFrame[] {
    return Array.from(this.pendingInputs.values())
      .filter(input => input.seq > lastAcked)
      .sort((a, b) => a.seq - b.seq);
  }
  
  private applyInput(input: InputFrame, player: Player) {
    // CRITICAL: Must match server movement logic exactly
    const speed = this.config.player_speed;
    const deltaTime = 1000 / this.config.tick_hz; // Fixed timestep
    
    player.x += input.move[0] * speed * deltaTime;
    player.y += input.move[1] * speed * deltaTime;
    
    // Apply constraints (walls, etc.) - must match server
    this.applyConstraints(player);
  }
}
```

**Key Requirements:**
- Client's `applyInput()` must be **byte-for-byte identical** to server's physics
- Use **fixed timestep** (see 16.1.4)
- Replay order must match original input order

---

#### 16.1.3 Smooth Error Correction (Priority 2)

**Problem:** When prediction mismatches server, instant snap to correct position is jarring.

**Solution:** Separate "true position" (authoritative) from "display position" (rendered). Lerp display to true over short duration.

**Implementation Pattern (from 4AM Games research):**

```typescript
// Client: src/mechanics/Movement.ts
class SmoothLocalPlayer extends Phaser.GameObjects.Sprite {
  // True position (server authoritative)
  trueX: number;
  trueY: number;
  
  // Display position (rendered, smoothed)
  displayX: number;
  displayY: number;
  
  // Error correction state
  isCorrectingError = false;
  errorCorrectionTimer = 0;
  errorCorrectionDuration = 0.25; // 250ms
  
  reconcile(serverPos: Vec2, predictedPos: Vec2) {
    // Snap true position immediately
    this.trueX = serverPos.x;
    this.trueY = serverPos.y;
    
    // Check for significant error
    const errorMagnitude = Phaser.Math.Distance.Between(
      predictedPos.x, predictedPos.y,
      serverPos.x, serverPos.y
    );
    
    const EPSILON = 0.001; // Floating point tolerance
    
    if (errorMagnitude > EPSILON) {
      // Activate smoothing
      this.isCorrectingError = true;
      this.errorCorrectionTimer = 0;
      
      // Keep displayX/Y at predicted position initially
      // Will lerp toward true position in update()
    } else {
      // No error, display = true
      this.displayX = this.trueX;
      this.displayY = this.trueY;
    }
  }
  
  update(deltaTime: number) {
    if (this.isCorrectingError) {
      // Lerp by constant factor
      const weight = 0.65; // Tunable (higher = slower correction)
      
      this.displayX = this.displayX * weight + this.trueX * (1.0 - weight);
      this.displayY = this.displayY * weight + this.trueY * (1.0 - weight);
      
      // Update timer
      this.errorCorrectionTimer += deltaTime;
      
      // Stop lerping after duration
      if (this.errorCorrectionTimer >= this.errorCorrectionDuration) {
        this.isCorrectingError = false;
        this.displayX = this.trueX;
        this.displayY = this.trueY;
      }
    } else {
      // Normal: display follows true
      this.displayX = this.trueX;
      this.displayY = this.trueY;
    }
    
    // Render at display position
    this.setPosition(this.displayX, this.displayY);
  }
}
```

**Configuration (add to Section 11.5):**

```json
{
  "reconciliation_epsilon": 0.001,
  "error_correction_duration_s": 0.25,
  "error_correction_lerp_weight": 0.65
}
```

**Visual Feedback:** Display green outline during error correction (useful for debugging/demos).

---

#### 16.1.4 Fixed Timestep Determinism (Priority 1)

**Problem:** Variable frame rates cause reconciliation to produce different results on replay, creating false mismatches.

**Solution:** Separate simulation (fixed timestep) from rendering (variable framerate).

**Implementation Pattern:**

```typescript
// Client: src/core/Time.ts or GameScene
class FixedTimestepSimulation {
  private readonly FIXED_TIMESTEP_MS = 1000 / 60; // 16.666ms (60 Hz)
  private accumulatedTime = 0;
  
  update(deltaTime: number) {
    this.accumulatedTime += deltaTime;
    
    // Run fixed-step simulation as many times as needed
    while (this.accumulatedTime >= this.FIXED_TIMESTEP_MS) {
      this.simulateFixedStep(this.FIXED_TIMESTEP_MS);
      this.accumulatedTime -= this.FIXED_TIMESTEP_MS;
    }
    
    // Rendering happens at variable framerate after simulation
  }
  
  private simulateFixedStep(dt: number) {
    // Physics, input processing, collision detection
    // ALL gameplay logic here uses fixed dt
    
    this.updatePlayerPhysics(dt);
    this.updateDiscPhysics(dt);
    this.processCollisions();
    
    // Send inputs at fixed rate
    if (this.shouldSendInput()) {
      this.sendInputToServer();
    }
  }
}
```

**Phaser 4 Configuration:**

```typescript
// In game config
const config = {
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,          // Fixed physics FPS
      fixedStep: true,  // CRITICAL: Enable fixed timestep
      debug: false
    }
  }
};
```

**CRITICAL RULE:** All gameplay logic (movement, cooldowns, timers) must use fixed timestep. Only rendering interpolates at variable framerate.

---

#### 16.1.5 Projectile Authority & Hit Detection (Priority 2)

**Problem:** Disc collisions are fast and critical. Server-only detection adds full RTT (~100ms) to hit feedback, making game feel sluggish.

**Solution:** Hybrid approach with optimistic client feedback and server validation.

**Recommended Pattern for DISCUS:**

```typescript
// Client: src/mechanics/Disc.ts
class DiscCollisionClient {
  throwDisc(velocity: Vec2) {
    // 1. Immediately show disc and play throw animation (optimistic)
    const disc = this.createDisc(this.player.x, this.player.y);
    disc.setVelocity(velocity.x, velocity.y);
    this.playThrowSound();
    this.playThrowAnimation();
    
    // 2. Send input to server
    this.room.send('throw', { 
      seq: this.inputSeq++,
      velocity: [velocity.x, velocity.y],
      timestamp: Date.now()
    });
    
    // 3. Predict collision locally (visual feedback only)
    this.physics.add.overlap(disc, this.enemies, (disc, enemy) => {
      // Optimistic: show impact effects immediately
      this.showImpactEffects(disc.x, disc.y);
      this.playHitSound();
      this.showDamageNumber(enemy);
      
      // Mark as "pending confirmation"
      disc.pendingHit = { enemyId: enemy.sessionId, timestamp: Date.now() };
      
      // DO NOT apply damage yet
    });
  }
  
  onServerEvent(event: GameEvent) {
    if (event.type === 'discHit') {
      const disc = this.discs.get(event.discId);
      
      if (disc.pendingHit && disc.pendingHit.enemyId === event.victimId) {
        // Prediction was correct! Confirm damage
        this.applyDamage(event.victimId, event.damage);
        disc.pendingHit = null;
      } else {
        // Prediction was wrong - show correction effects
        if (!disc.pendingHit) {
          // We didn't predict this hit - show late
          this.showImpactEffects(event.position.x, event.position.y);
          this.playHitSound();
        }
        
        // Apply authoritative damage
        this.applyDamage(event.victimId, event.damage);
      }
    }
  }
}
```

**Server: Authoritative Collision Detection**

```typescript
// Server: src/rooms/MatchRoom.ts
class MatchRoomCollisions {
  onMessage(client: Client, type: string, message: any) {
    if (type === 'throw') {
      // Validate throw action
      const player = this.state.players.get(client.sessionId);
      
      if (!this.canThrow(player)) {
        return; // Reject invalid throw
      }
      
      // Create authoritative disc
      const disc = new Disc(player.x, player.y, message.velocity);
      this.state.discs.set(disc.id, disc);
    }
  }
  
  updatePhysics(deltaTime: number) {
    // Server runs authoritative collision detection
    for (const disc of this.state.discs.values()) {
      for (const player of this.state.players.values()) {
        if (this.checkCollision(disc, player)) {
          // Authoritative hit!
          this.broadcast('discHit', {
            discId: disc.id,
            victimId: player.sessionId,
            damage: 1,
            position: { x: disc.x, y: disc.y },
            timestamp: Date.now()
          });
          
          // Apply damage on server
          this.handleDisintegration(player);
        }
      }
    }
  }
}
```

**Benefits:**
- Players see instant visual/audio feedback (~0ms delay)
- Server validates all hits (prevents cheating)
- Mismatches are rare and corrected silently
- Maintains "arcade-speed feel" over network

---

#### 16.1.6 State History Buffer Management (Priority 2)

**Problem:** Need to store past inputs for reconciliation, but can't store unlimited history.

**Solution:** Circular buffer with automatic cleanup based on acknowledged sequence numbers.

**Implementation Pattern:**

```typescript
// Client: src/net/InputHistory.ts
class InputHistoryBuffer {
  private readonly MAX_FRAMES: number;
  private buffer: Map<number, InputFrame> = new Map();
  
  constructor(config: GameConfig) {
    // Calculate based on worst-case RTT
    const maxRTT_ms = config.max_expected_rtt_ms || 500;
    const tickRate = config.tick_hz || 60;
    
    // Buffer size = RTT in ticks + safety margin
    this.MAX_FRAMES = Math.ceil((maxRTT_ms / 1000) * tickRate) + 10;
  }
  
  store(input: InputFrame) {
    this.buffer.set(input.seq, input);
    
    // Prevent unbounded growth
    if (this.buffer.size > this.MAX_FRAMES) {
      const oldestSeq = Math.min(...this.buffer.keys());
      this.buffer.delete(oldestSeq);
    }
  }
  
  acknowledgeUpTo(seq: number) {
    // Remove all inputs up to acknowledged sequence
    for (const [inputSeq] of this.buffer) {
      if (inputSeq <= seq) {
        this.buffer.delete(inputSeq);
      }
    }
  }
  
  getUnacknowledged(lastAckedSeq: number): InputFrame[] {
    return Array.from(this.buffer.values())
      .filter(input => input.seq > lastAckedSeq)
      .sort((a, b) => a.seq - b.seq);
  }
  
  clear() {
    this.buffer.clear();
  }
}
```

**Configuration (add to Section 11.5):**

```json
{
  "max_expected_rtt_ms": 500,
  "client_input_history_frames": 20,
  "auto_cleanup_age_ms": 2000
}
```

---

#### 16.1.7 Floating Point Epsilon Tolerance (Priority 2)

**Problem:** Different CPUs produce slightly different floating point results. Causes false mismatch detection.

**Solution:** Use epsilon threshold when comparing positions.

**Implementation Pattern:**

```typescript
// Client: src/net/Reconciliation.ts
class ReconciliationHelpers {
  private readonly POSITION_EPSILON = 0.001; // 1/1000th of pixel
  private readonly VELOCITY_EPSILON = 0.01;
  
  positionsMatch(a: Vec2, b: Vec2): boolean {
    return Math.abs(a.x - b.x) < this.POSITION_EPSILON &&
           Math.abs(a.y - b.y) < this.POSITION_EPSILON;
  }
  
  velocitiesMatch(a: Vec2, b: Vec2): boolean {
    return Math.abs(a.x - b.x) < this.VELOCITY_EPSILON &&
           Math.abs(a.y - b.y) < this.VELOCITY_EPSILON;
  }
  
  detectMismatch(predicted: EntityState, authoritative: EntityState): boolean {
    // Only trigger correction if error exceeds epsilon
    return !this.positionsMatch(predicted.position, authoritative.position) ||
           !this.velocitiesMatch(predicted.velocity, authoritative.velocity);
  }
}
```

**Configuration (add to Section 11.5):**

```json
{
  "reconciliation_epsilon_position": 0.001,
  "reconciliation_epsilon_velocity": 0.01,
  "reconciliation_epsilon_rotation": 0.01
}
```

---

#### 16.1.8 Colyseus + Phaser Integration Patterns (Priority 1)

**Standard patterns from official Colyseus tutorials:**

```typescript
// Client: src/scenes/GameScene.ts
export class GameScene extends Phaser.Scene {
  room: Room;
  playerEntities: { [sessionId: string]: Phaser.GameObjects.Sprite } = {};
  
  async create() {
    // Connect to room
    this.room = await this.connectToRoom();
    
    // 1. Handle player joins
    this.room.state.players.onAdd((player, sessionId) => {
      const isLocal = sessionId === this.room.sessionId;
      
      const sprite = this.add.sprite(player.x, player.y, 'player');
      this.playerEntities[sessionId] = sprite;
      
      // 2. Listen for state changes (interpolation for remote players)
      if (!isLocal) {
        player.onChange(() => {
          // Smooth interpolation for remote players
          this.tweens.add({
            targets: sprite,
            x: player.x,
            y: player.y,
            duration: 50,
            ease: 'Linear'
          });
        });
      }
    });
    
    // 3. Handle player leaves
    this.room.state.players.onRemove((player, sessionId) => {
      const sprite = this.playerEntities[sessionId];
      sprite.destroy();
      delete this.playerEntities[sessionId];
    });
    
    // 4. Handle custom events
    this.room.onMessage('discHit', (data) => {
      this.handleDiscHit(data);
    });
  }
  
  update(time: number, delta: number) {
    if (!this.room) return;
    
    // 5. Send inputs at fixed rate (not every frame)
    if (time > this.lastInputTime + 16.66) { // 60 Hz
      this.sendInput();
      this.lastInputTime = time;
    }
    
    // 6. Local player uses prediction (no tween)
    const localPlayer = this.playerEntities[this.room.sessionId];
    if (localPlayer) {
      // Update display position from reconciled true position
      localPlayer.setPosition(this.localPlayerState.displayX, this.localPlayerState.displayY);
    }
  }
  
  sendInput() {
    const input = {
      seq: this.inputSequence++,
      move: [this.cursors.left.isDown ? -1 : this.cursors.right.isDown ? 1 : 0,
             this.cursors.up.isDown ? -1 : this.cursors.down.isDown ? 1 : 0],
      buttons: {
        throw: this.throwKey.isDown,
        block: this.blockKey.isDown,
        dodge: Phaser.Input.Keyboard.JustDown(this.dodgeKey)
      }
    };
    
    this.room.send('input', input);
    this.applyInputLocally(input); // Client prediction
  }
}
```

**Critical Patterns:**
- `onAdd` / `onRemove` for entity lifecycle
- `onChange` for state synchronization (NOT continuous polling)
- Tweens for remote players, direct updates for local player
- Fixed-rate input sending (60 Hz, not 120 FPS)

---

#### 16.1.9 Timed Events During Reconciliation (Priority 3)

**Problem:** Cooldowns, stun timers, and perfect block windows tick during reconciliation replay, causing desync.

**Solution:** Replay must be deterministic. Track cooldowns by **server tick** not elapsed time.

**Implementation Pattern:**

```typescript
// Shared: src/shared/TimedAbility.ts (used by both client and server)
class CooldownState {
  lastUsedTick: number = 0;
  cooldownTicks: number; // Not seconds!
  
  canUse(currentTick: number): boolean {
    return (currentTick - this.lastUsedTick) >= this.cooldownTicks;
  }
  
  use(currentTick: number) {
    this.lastUsedTick = currentTick;
  }
}

// Client: During reconciliation
class ReconciliationWithTimers {
  replay(unacknowledgedInputs: InputFrame[], serverTick: number) {
    // Reset cooldown to server state
    this.dodgeCooldown.lastUsedTick = this.serverState.dodgeLastUsedTick;
    
    let simulatedTick = serverTick;
    
    for (const input of unacknowledgedInputs) {
      simulatedTick++;
      
      // Apply input with cooldown check
      if (input.buttons.dodge && this.dodgeCooldown.canUse(simulatedTick)) {
        this.applyDodge();
        this.dodgeCooldown.use(simulatedTick);
      }
      
      // Move player
      this.applyMovement(input);
    }
  }
}
```

**Key Principle:** All timed events must be tied to **tick count** (deterministic) not `Date.now()` (non-deterministic).

---

#### 16.1.10 Bandwidth Optimization: Input Batching (Priority 3)

**Problem:** 8 players × 60 inputs/sec = 480 messages/sec to server. At scale this is high bandwidth.

**Solution:** Batch multiple input frames into single packet.

**Implementation Pattern:**

```typescript
// Client: src/net/InputBatcher.ts
class InputBatcher {
  private pendingBatch: InputFrame[] = [];
  private readonly BATCH_SIZE = 3; // Send every 3 frames (20 Hz actual send rate)
  
  addInput(input: InputFrame) {
    this.pendingBatch.push(input);
    
    if (this.pendingBatch.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }
  
  flush() {
    if (this.pendingBatch.length === 0) return;
    
    this.room.send('inputBatch', {
      frames: this.pendingBatch
    });
    
    this.pendingBatch = [];
  }
  
  update() {
    // Flush periodically even if batch not full (prevent stale inputs)
    if (this.pendingBatch.length > 0 && Date.now() - this.lastFlush > 50) {
      this.flush();
    }
  }
}
```

**Tradeoff:** Reduces messages but increases per-message latency by ~16-32ms. Use only if bandwidth is bottleneck.

---

#### 16.1.11 Server Tick Rate vs Snapshot Rate (Priority 1)

**Concept from Gambetta Part III - Essential Understanding:**

The server runs two different loops at different rates:
1. **Simulation Loop (Tick Rate):** 60 Hz - processes all physics, collisions, inputs
2. **Broadcast Loop (Snapshot Rate):** 20-30 Hz - sends world state to clients

**Why Different Rates?**

Running simulation at 60 Hz is necessary for:
- Frame-perfect mechanics (3-frame perfect block window = 50ms at 60 Hz)
- Smooth physics without tunneling
- Deterministic collision detection
- Precise cooldown timers

But broadcasting at 60 Hz would:
- Consume 2-3x more bandwidth than necessary
- Overwhelm clients with data they can't fully process
- Provide diminishing returns (human reaction time ~150ms, not 16ms)

**Implementation Pattern:**

```typescript
// Server: src/rooms/MatchRoom.ts
class MatchRoom extends Room {
  private readonly SIMULATION_TICK_MS = 1000 / 60;  // 16.666ms
  private readonly SNAPSHOT_TICK_MS = 1000 / 30;    // 33.333ms
  
  private simulationAccumulator = 0;
  private snapshotAccumulator = 0;
  
  private inputQueue: InputFrame[] = [];
  
  onCreate() {
    // Game loop runs as fast as possible
    this.setSimulationInterval((deltaTime) => {
      this.simulationAccumulator += deltaTime;
      this.snapshotAccumulator += deltaTime;
      
      // Fixed timestep simulation (may run multiple times per frame)
      while (this.simulationAccumulator >= this.SIMULATION_TICK_MS) {
        this.processQueuedInputs();
        this.updatePhysics(this.SIMULATION_TICK_MS);
        this.detectCollisions();
        this.simulationAccumulator -= this.SIMULATION_TICK_MS;
        this.serverTick++;
      }
      
      // Broadcast snapshots at lower rate
      if (this.snapshotAccumulator >= this.SNAPSHOT_TICK_MS) {
        this.broadcastSnapshot();
        this.snapshotAccumulator -= this.SNAPSHOT_TICK_MS;
      }
    });
  }
  
  onMessage(client: Client, type: string, message: InputFrame) {
    if (type === 'input') {
      // Don't process immediately - queue it
      this.inputQueue.push({
        client: client.sessionId,
        seq: message.seq,
        timestamp: message.timestamp,
        data: message
      });
    }
  }
  
  private processQueuedInputs() {
    // Process ALL queued inputs this tick
    // Critical: inputs from all players processed atomically
    while (this.inputQueue.length > 0) {
      const input = this.inputQueue.shift();
      this.applyInput(input);
    }
  }
  
  private broadcastSnapshot() {
    const snapshot = {
      serverTick: this.serverTick,
      timestamp: Date.now(),
      entities: this.serializeEntities(),
      events: this.pendingEvents // Discrete events since last snapshot
    };
    
    // Per-client acknowledgment
    this.clients.forEach(client => {
      const lastAcked = this.getLastProcessedSeq(client.sessionId);
      this.send(client, 'snapshot', {
        ...snapshot,
        ackInputSeq: lastAcked
      });
    });
    
    this.pendingEvents = []; // Clear events after broadcast
  }
}
```

**Benefits for DISCUS:**
- **60 Hz sim:** Perfect timing windows feel responsive
- **30 Hz snapshots:** Bandwidth reduced by 50%, no perceptible quality loss
- **Input queuing:** All 8 players' inputs processed atomically each tick (fairness)
- **Discrete events:** High-priority events (disc hits, perfect blocks) sent immediately, not waiting for next snapshot

**Client-Side Impact:**
Client must interpolate between 30 Hz snapshots to render at 60 FPS. This is where entity interpolation (16.1.3) and smooth error correction (16.1.3) become critical.

**Configuration (add to Section 11.5):**

```json
{
  "server_simulation_hz": 60,
  "server_snapshot_hz": 30,
  "client_render_hz": 60,
  "input_queue_max_age_ms": 100
}
```

---

#### 16.1.12 Reference Resources

**Essential Reading:**
1. **Gabriel Gambetta - Fast-Paced Multiplayer Series**
   - Part I: Client-Server Architecture
   - Part II: Client-Side Prediction & Reconciliation (CRITICAL)
   - Part III: Entity Interpolation
   - Part IV: Lag Compensation
   - Live Demo: https://www.gabrielgambetta.com/client-side-prediction-live-demo.html

2. **4AM Games - Smooth Server Reconciliation**
   - https://fouramgames.com/blog/fast-paced-multiplayer-implementation-smooth-server-reconciliation
   - Interactive demo with error correction visualization

3. **Colyseus Official Tutorial - Phaser Integration**
   - https://docs.colyseus.io/tutorial/phaser/
   - Parts 1-4 cover: basic setup, interpolation, prediction, fixed tickrate

4. **Source Engine Multiplayer Networking**
   - Valve's classic article on lag compensation
   - Foundational for all authoritative server games

**Implementation Examples:**
- Colyseus + Phaser Tutorial Repo: https://github.com/colyseus/tutorial-phaser
- Phaser 3 Multiplayer with Physics: https://github.com/yandeu/phaser3-multiplayer-with-physics

---

#### 16.1.13 Entity Interpolation for Remote Players (Priority 2)

**Concept from Gambetta Part III:**

You cannot predict remote players' movements (you don't know their inputs). Dead reckoning fails for DISCUS because players can instantly change direction. Solution: **show remote players in the past**, interpolating between known authoritative positions.

**The Timeline Problem:**

```
Server sends snapshots every 33ms (30 Hz):
t=0ms:   Server snapshot (Player 2 at x=100)
t=33ms:  Server snapshot (Player 2 at x=105)
t=66ms:  Server snapshot (Player 2 at x=112)

Without interpolation, Player 2 teleports: 100 → 105 → 112

With interpolation, Player 2 smoothly moves from 100 to 105 over 33ms,
then 105 to 112 over next 33ms.
```

**Implementation Pattern:**

```typescript
// Client: src/mechanics/RemotePlayerInterpolation.ts
class RemotePlayer {
  // Interpolation buffer: stores last N snapshots
  private positionBuffer: Array<{
    serverTick: number,
    timestamp: number,
    x: number,
    y: number
  }> = [];
  
  private readonly INTERPOLATION_DELAY_MS = 100; // Render 100ms in past
  
  onServerSnapshot(snapshot: PlayerSnapshot) {
    // Add to buffer
    this.positionBuffer.push({
      serverTick: snapshot.serverTick,
      timestamp: snapshot.timestamp,
      x: snapshot.x,
      y: snapshot.y
    });
    
    // Keep buffer size manageable (last 5 snapshots)
    if (this.positionBuffer.length > 5) {
      this.positionBuffer.shift();
    }
  }
  
  update(currentTime: number) {
    // Render time is current time minus interpolation delay
    const renderTime = currentTime - this.INTERPOLATION_DELAY_MS;
    
    // Find two snapshots that bracket render time
    let from: Snapshot = null;
    let to: Snapshot = null;
    
    for (let i = 0; i < this.positionBuffer.length - 1; i++) {
      if (this.positionBuffer[i].timestamp <= renderTime &&
          this.positionBuffer[i + 1].timestamp >= renderTime) {
        from = this.positionBuffer[i];
        to = this.positionBuffer[i + 1];
        break;
      }
    }
    
    if (!from || !to) {
      // Not enough data yet, or too far behind - use latest
      const latest = this.positionBuffer[this.positionBuffer.length - 1];
      if (latest) {
        this.sprite.setPosition(latest.x, latest.y);
      }
      return;
    }
    
    // Interpolate between from and to
    const duration = to.timestamp - from.timestamp;
    const elapsed = renderTime - from.timestamp;
    const t = elapsed / duration; // 0.0 to 1.0
    
    const interpolatedX = from.x + (to.x - from.x) * t;
    const interpolatedY = from.y + (to.y - from.y) * t;
    
    this.sprite.setPosition(interpolatedX, interpolatedY);
  }
}
```

**Why This Works:**

When you receive snapshot at t=1000ms, you already have snapshot from t=967ms (previous). From t=1000 to t=1033, you render what actually happened from t=900 to t=933. You're always showing real movement data, just delayed.

**Trade-offs for DISCUS:**

**Pros:**
- Silky smooth remote player movement (no prediction errors)
- Never shows impossible movement (players don't teleport through walls)
- Authoritative data only (no guessing)

**Cons:**
- Remote players appear 100-120ms delayed
- Disc throws from remote players appear late
- Hitting moving targets requires understanding of temporal mismatch

**Special Case - Remote Player Discs:**

Remote player discs should follow same interpolation as their owner:

```typescript
class RemoteDisc {
  onServerSnapshot(snapshot: DiscSnapshot) {
    this.positionBuffer.push({
      timestamp: snapshot.timestamp,
      x: snapshot.x,
      y: snapshot.y,
      velocityX: snapshot.velocityX,
      velocityY: snapshot.velocityY
    });
  }
  
  update(currentTime: number) {
    // Interpolate position just like remote players
    const renderTime = currentTime - this.INTERPOLATION_DELAY_MS;
    // ... same interpolation logic as RemotePlayer
  }
}
```

**Configuration (add to Section 11.5):**

```json
{
  "interpolation_buffer_ms": 120,
  "interpolation_buffer_snapshots": 5,
  "extrapolation_limit_ms": 50
}
```

**Performance Note:**
With 8 players, you're interpolating 8 remote player positions + up to 8 discs = 16 entities at 60 FPS. This is trivial CPU cost (linear interpolation), but maintaining position buffers requires memory discipline (circular buffers, not unbounded arrays).

---

#### 16.1.14 Putting It All Together - The Complete DISCUS Network Model

**Summary of Gambetta Series Applied to Fast-Twitchy DISCUS Gameplay:**

The four Gambetta articles provide the complete foundation for DISCUS's netcode. Here's how they interconnect:

**Part I - The Foundation (Authoritative Server):**
- Server owns all game state (positions, disc threat status, scores)
- Clients send inputs only (move, throw, block, dodge)
- Prevents cheating but introduces ~50-250ms delay problem

**Part II - Local Player Responsiveness (Prediction + Reconciliation):**
- Client predicts own actions immediately (throw disc, move, dodge)
- When server snapshot arrives (100ms later), reconcile:
  1. Accept server position as truth
  2. Replay unacknowledged inputs on top
  3. Smooth any mismatch with error correction lerp
- Result: Local player feels instant, despite 100ms network delay

**Part III - Remote Player Smoothness (Interpolation):**
- Can't predict remote players (don't know their inputs)
- Show remote players 100ms in the past, interpolating between snapshots
- Server sends 30 Hz snapshots, client interpolates to render 60 FPS
- Result: Remote players move smoothly, not teleporting

**Part IV - Spatial Accuracy (Lag Compensation):**
- Problem: You see remote players in the past due to interpolation
- When you throw disc at them, server must validate hit
- Server **rewinds time** to your perspective when you threw
- Checks if disc would have hit at that moment in history
- Result: Hits feel fair even though everyone sees different timelines

**DISCUS-Specific Implementation Strategy:**

```
Timeline for 8-player match with 100ms RTT:

CLIENT 1 (YOU):
t=0ms:     Press throw button
           ↓ Predict immediately: show disc, play SFX
           ↓ Send input to server
t=50ms:    Server receives input
           ↓ Server validates throw
           ↓ Server creates authoritative disc
           ↓ Server detects collision with Client 2 at rewind time
           ↓ Server broadcasts hit event
t=100ms:   Receive server confirmation
           ↓ Reconcile: predicted hit was correct
           
CLIENT 2 (REMOTE PLAYER):
t=0ms:     Moving right at x=100
t=100ms:   Actually at x=110, but you see them at x=100 (interpolation delay)
           ↓ Your disc hits their interpolated position
           ↓ Server validates against their actual position at t=0
           ↓ Hit confirmed!
           
RESULT: 
- You: Instant feedback, smooth experience
- Them: Fair hit (server checked their actual position)
- Spectators: See consistent, authoritative game state
```

**Critical Differences from Typical Shooters:**

Most Gambetta examples use hitscan weapons (instant bullets). DISCUS uses **projectiles with travel time**:

1. **Disc Travel Time (~500ms across arena):**
   - Longer than network delay (100ms)
   - Prediction must track disc for full trajectory
   - Hit detection happens when disc reaches target, not when thrown

2. **Perfect Block Window (3 frames = 50ms):**
   - Smaller than network delay (100ms)
   - Requires latency compensation (+2 frames server-side)
   - Player must block "in the past" from server perspective

3. **8 Simultaneous Players:**
   - 8 local predictions running (8 discs in flight)
   - 56 interpolated remote entities (7 players + 7 discs per client)
   - Server must reconcile 8 input streams at 60 Hz

**Memory & Performance Budget:**

Per client, maintain:
- **Input History:** 20 frames × 32 bytes = 640 bytes
- **Position Buffer:** 5 snapshots × 8 remote players × 16 bytes = 640 bytes  
- **Disc History:** 8 discs × 5 snapshots × 24 bytes = 960 bytes
- **Total:** ~2.5 KB per client (trivial)

CPU budget per frame (16.66ms):
- Input prediction: <0.1ms (simple movement physics)
- Reconciliation: <2ms (10 input replays worst case)
- Interpolation: <0.5ms (16 linear interpolations)
- Rendering: remaining budget (~14ms)

**Why This Works for DISCUS:**

1. **Deterministic Physics:** Arcade physics = simple, predictable, replayable
2. **Limited Actions:** 4 buttons (not 20+ like MMO)
3. **Bounded Arena:** No infinite worlds, easy to validate positions
4. **Discrete Events:** Hits, blocks, disintegrations are atomic (not continuous)
5. **Visual Clarity:** Trails and outlines hide minor position corrections

**Common Pitfalls to Avoid:**

❌ Predicting remote player inputs (impossible, causes jitter)  
✅ Interpolate remote players between authoritative positions

❌ Sending full game state every frame (bandwidth explosion)  
✅ Send snapshots at 30 Hz, simulate at 60 Hz

❌ Applying server position instantly (causes snapping)  
✅ Lerp display position to true position over 250ms

❌ Validating hits at client present time (unfair)  
✅ Rewind server to client's perspective for validation

❌ Using `Date.now()` for cooldowns (non-deterministic)  
✅ Use server tick count (deterministic, replayable)

---

#### 16.1.15 Testing & Validation Checklist

**Alpha Milestone Validation:**
- [ ] Input sequence numbers increment correctly
- [ ] Server acknowledges inputs with correct sequence
- [ ] Reconciliation doesn't cause visible jumps with 0ms simulated lag
- [ ] Reconciliation correctly handles 250ms simulated lag
- [ ] Fixed timestep maintains consistent physics across framerates
- [ ] Remote players interpolate smoothly
- [ ] **Server simulation runs at 60 Hz independently of snapshot rate**
- [ ] **Server snapshots broadcast at 30 Hz consistently**
- [ ] **Input queue processes all queued inputs each simulation tick**
- [ ] **Remote player interpolation buffer maintains 5 snapshots**
- [ ] **Interpolation renders remote players 100ms in the past**

**Beta Milestone Validation:**
- [ ] Error correction lerp activates on mismatch
- [ ] Epsilon tolerance prevents false positives from floating point drift
- [ ] Disc throw shows immediate feedback, server confirms hit
- [ ] Cooldowns remain synced after reconciliation
- [ ] 8 players simultaneously doesn't degrade prediction quality
- [ ] Input history buffer doesn't leak memory
- [ ] **Remote player movement appears smooth at 30 Hz snapshots rendered at 60 FPS**
- [ ] **Disc hits on moving targets feel fair (temporal accuracy)**
- [ ] **Server rewinds correctly for hit validation**
- [ ] **Network delay of 250ms still feels responsive**
- [ ] **Position buffer cleanup prevents memory growth**

**Performance Targets:**
- Client prediction feels instant (<16ms perceived delay)
- Reconciliation errors < 1 pixel for 100ms RTT
- Reconciliation cost < 2ms CPU time for 10 replayed frames
- Memory: Input history < 10KB per client
- **Interpolation cost < 0.5ms for 16 entities at 60 FPS**
- **Server can maintain 60 Hz simulation with 8 connected clients**
- **Client maintains 60 FPS with 7 remote players + 8 discs interpolating**

**Network Simulation Testing:**

Create artificial network conditions for testing:

```typescript
// Test harness: src/sim/NetworkSimulator.ts
class NetworkSimulator {
  private readonly latency_ms: number;
  private readonly jitter_ms: number;
  private readonly packet_loss_percent: number;
  
  simulateLatency(message: any, callback: () => void) {
    const delay = this.latency_ms + (Math.random() * this.jitter_ms);
    
    // Simulate packet loss
    if (Math.random() * 100 < this.packet_loss_percent) {
      return; // Drop packet
    }
    
    setTimeout(callback, delay);
  }
}

// Test scenarios:
const scenarios = [
  { name: "LAN", latency: 10, jitter: 2, loss: 0.1 },
  { name: "Good Cable", latency: 50, jitter: 10, loss: 0.5 },
  { name: "WiFi", latency: 80, jitter: 30, loss: 2.0 },
  { name: "Mobile", latency: 150, jitter: 50, loss: 5.0 },
  { name: "Terrible", latency: 300, jitter: 100, loss: 10.0 }
];
```

**Validation Scenarios:**

1. **"Impossible Shot" Test:**
   - Remote player runs left at full speed
   - You throw disc at their interpolated position
   - Disc should hit (server rewinds to validate)
   - Record hit rate, should be >95%

2. **"Perfect Block" Test:**
   - Simulate 150ms RTT
   - Local player attempts perfect block on incoming disc
   - With +2 frame compensation, success rate should match 0ms RTT within 5%

3. **"8-Player Chaos" Test:**
   - All 8 players moving and throwing simultaneously
   - Monitor frame time, should stay <16.66ms
   - Monitor server tick rate, should maintain 60 Hz ±1 Hz
   - No position corrections >10 pixels over 30 seconds

4. **"Rubber Band" Test:**
   - Simulate packet loss (drop every 3rd snapshot)
   - Remote players should still move smoothly (interpolation fills gaps)
   - When snapshot arrives, position should correct without visible snap

5. **"Temporal Accuracy" Test:**
   - Record timestamps: client throw → server receive → server validate → client confirm
   - Total round trip should be RTT + processing (< RTT + 20ms)
   - Hit validation should use client's past position, not server present

---

### Doc-First Canon

This prose is the **single source of truth**. Do **not** maintain shadow docs.

### agents.md Obedience

- When adding functionality, **locate the file responsible for that domain** (via `agents.md`) and place code **there**, not in new monoliths.
- If a mechanic exists (e.g., *Parry.ts*), **edit that file only**.

### One Mechanic per File

- `create(scene, bus, cfg) -> { update, dispose }` export.
- No cross-imports between mechanics; communicate via **EventBus**.

### JSON-Only Tuning

- Read **only your slice** from `/src/config/*.json`.
- Add schema entries when introducing new tunables.

### No DOM/Electron/Netcode inside Mechanics

DOM (Bootstrap) lives under `/ui/dom`; Electron under `/electron`; Netcode under `/net` and `/server`.

### Small Bites

- Implement features as **tiny, testable modules**. Provide unit tests where feasible.
- Never block the frame; heavy work via `scene.time.delayedCall` or split across frames.

### Spectator/Replay Unification

- Use **Match Data Recorder** for both delayed live feeds and file replays.
- Do not fork code paths for recording and streaming; serialize once.

### Server Authority

- Accept **inputs only**; validate caps and cooldowns on server.
- All scoring/hits generated server-side.

### Accessibility Always On

- Keep colorblind palettes and outlines functional in every build.
- Ensure defaults are playable without configuration.

### Settings Manager Hooks

- Expose a **stable API** for external settings app (IPC/file).
- Do not hardcode paths; prefer Electron's `app.getPath('userData')`.

### Phaser 4 Physics

- Prefer **Arcade** for v1; add **manual CCD** for discus only.
- Keep bodies simple (circle disc, rect player) for stability/readability.

## 17) OPEN QUESTIONS & NEXT STEPS

- Final hazard timing sets per arena?
- Cosmetic pipeline (server-compose vs client-compose fallback) default?
- Tournament camera presets for large maps?
- Streaming overlays: safe HUD channels for casters?

---

## 18) SOURCES & REFERENCES

This document incorporates research and best practices from the following sources, which informed the multiplayer architecture (Section 12) and implementation patterns (Section 16.1).

### Multiplayer Networking - Core Theory

**Gabriel Gambetta - Fast-Paced Multiplayer Series**
- Part I: Client-Server Game Architecture  
  https://www.gabrielgambetta.com/client-server-game-architecture.html
- Part II: Client-Side Prediction and Server Reconciliation (CRITICAL)  
  https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
- Part III: Entity Interpolation  
  https://www.gabrielgambetta.com/entity-interpolation.html
- Part IV: Lag Compensation  
  https://www.gabrielgambetta.com/lag-compensation.html
- Live Interactive Demo  
  https://www.gabrielgambetta.com/client-side-prediction-live-demo.html

**4AM Games - Smooth Server Reconciliation**
- Blog Post with Interactive Demo  
  https://fouramgames.com/blog/fast-paced-multiplayer-implementation-smooth-server-reconciliation
- Demonstrates error correction lerp technique used in Section 16.1.3

**Wikipedia - Client-side Prediction**
- https://en.wikipedia.org/wiki/Client-side_prediction
- Historical context (Duke Nukem 3D, QuakeWorld)

**DanielJimenezMorales - Client-Side Prediction Deep Dive**
- https://danieljimenezmorales.github.io/2025-06-20-client-side-prediction-and-server-reconciliation/
- Performance analysis and re-simulation costs

**Game Development Stack Exchange - Networking Questions**
- Forced Movement During Prediction  
  https://gamedev.stackexchange.com/questions/192385/networking-a-fast-paced-game-2d-forced-movement-server-client
- Timed Events in Prediction/Reconciliation  
  https://gamedev.stackexchange.com/questions/136094/how-do-you-handle-timed-events-in-prediction-reconciliation-client-model

**GameDev.net Forums**
- Combining Server Reconciliation and Client-Side Prediction  
  https://www.gamedev.net/forums/topic/705066-combining-server-reconciliation-and-client-side-prediction/

**Game Dev FAQs**
- Reconciling Differing Client Predictions  
  https://gamedevfaqs.com/reconciling-differing-client-predictions-in-fast-paced-multiplayer-games/

**Medium - Christian Tucker**
- Seamless Fast-Paced Multiplayer in Unity3D (patterns apply to Phaser)  
  https://medium.com/@christian.tucker_68732/seamless-fast-paced-multiplayer-in-unity3d-implementing-client-side-prediction-ab520bf49bd1

### Colyseus Framework

**Colyseus Official Documentation**
- Main Documentation  
  https://docs.colyseus.io/
- Phaser Tutorial - Part 1: Basic Player Movement  
  https://docs.colyseus.io/tutorial/phaser/basic-player-movement
- Phaser Tutorial - Complete Series  
  https://docs.colyseus.io/tutorial/phaser/
- Learn Colyseus with Phaser  
  https://learn.colyseus.io/phaser/1-basic-player-movement
- Main Learn Portal  
  https://colyseus.io/learn/phaser/

**Colyseus Community & Examples**
- Colyseus Discussion Group - Phaser 3 Integration  
  https://discuss.colyseus.io/topic/143/phaser-3-integration-server-and-client
- Phaser Discourse - Real-Time Multiplayer with Physics  
  https://phaser.discourse.group/t/phaser-3-real-time-multiplayer-game-with-physics/1739
- Phaser Discourse - Multiplayer Physics Approaches  
  https://phaser.discourse.group/t/how-to-approach-phaser-3-multiplayer-with-physics/1579

**Colyseus Code Examples**
- Official Tutorial Repository  
  https://github.com/colyseus/tutorial-phaser
- PatBG's Tutorial Fork  
  https://github.com/PatBG/tutorial-phaser-colyseus
- Phaser 3 Multiplayer with Physics (MatterJS and Arcade)  
  https://github.com/yandeu/phaser3-multiplayer-with-physics
- Loversama's Fork  
  https://github.com/loversama/phaser3-multiplayer-with-physics

**Colyseus Articles & Blogs**
- RAVALMATIC - Colyseus Review  
  https://www.ravalmatic.com/colyseus-an-uncomplicated-library-for-multiplayer-games/
- ResearchHub - Colyseus Client Template Guide  
  https://researchhub.blog/colyseus-client-template-build-multiplayer

### Phaser Framework

**Phaser Physics & Groups**
- CodeCaptain - Shooting Bullets in Phaser 3 Using Arcade Physics Groups  
  https://codecaptain.io/blog/game-development/shooting-bullets-phaser-3-using-arcade-physics-groups/696
- Phaser Discourse - Shooting Bullets Tutorial  
  https://phaser.discourse.group/t/shooting-bullets-in-phaser-3-using-arcade-physics-groups/5368
- HTML5GameDevs Forum - Shooting Bullets  
  https://www.html5gamedevs.com/topic/44805-shooting-bullets-in-phaser-3-using-arcade-physics-groups/
- Phaser Official News - Shooting Bullets Tutorial  
  https://phaser.io/news/2016/03/shooting-bullets-tutorial

**Phaser Game Examples**
- Emanuele Feronato - Radical Game with Arcade Physics  
  https://emanueleferonato.com/2019/04/15/radical-html5-game-prototype-built-with-phaser-and-arcade-physics-updated-to-phaser-3-featuring-arcade-groups-and-object-pooling/
- Phaser Games - Physics for Beginners  
  https://phasergames.com/phaser-3-physics-beginners/

**Phaser Multiplayer Templates**
- Ourcade - Multiplayer Tic-Tac-Toe Starter  
  https://ourcade.co/templates/multiplayer-tic-tac-toe-starter/

### Accessibility Guidelines

**Xbox Accessibility Guidelines (XAG)**
- Section 10.2 accessibility implementation guidelines are based on research from Microsoft's Xbox Accessibility Guidelines and the Gaming & Disability Community
- These guidelines inform text display, contrast, input remapping, time limits, photosensitivity, and mental health considerations

### Additional Context

**Colyseus vs Direct Implementation**
- While some sources discussed direct Node.js + WebSocket implementations, this GDD specifically chose Colyseus for its room management, state synchronization, and matchmaking features
- The framework reduces boilerplate while maintaining full control over authoritative server logic

**Fighting Game Netcode Influence**
- Section 12.6 patterns are inspired by fighting game netcode (SF6, GGPO) adapted for DISCUS's authoritative server model
- Frame-perfect timing windows and rollback-inspired reconciliation provide arcade-speed responsiveness

### Document Evolution

This GDD is a living document that synthesizes these sources into a cohesive, implementation-ready specification for DISCUS. All external patterns have been adapted to fit the game's specific requirements: 2D top-down arena combat with projectiles, 8-player matches, and 60 Hz authoritative server architecture.

**Last Updated:** Version 21 — October 23, 2025
