# DISCUS --- GAME DESIGN DOCUMENT

### Version 24

## 1) METADATA & PURPOSE

**Title:** Discus

**Status:** In Progress (living document)

**Genre:** 2D top-down arena action (arcade-speed)

**Engine:** Phaser 4 (web-first), Node.js (server), Colyseus
(authoritative multiplayer)

**Packaging:** Electron desktop build (Windows/macOS; Linux optional)

**Rendering:** WebGL (Canvas fallback) --- **2D "sprite" atlas-based
game**

**Input:** KB/M + Gamepad (Gamepad API); **Arcade Mode** = gamepad-only

**Testing Runtime:** Chrome (desktop); parity with Electron (Chromium)

**Target Audience (Players)**

Players who enjoy classic arcade games, multiplayer team-based and
deathmatch-style competition, and easy-to-watch gameplay suitable for
streaming on Twitch.

- **Casual Players:** Ages 12 and up seeking accessible,
  pick-up-and-play action with clear visual feedback and straightforward
  mechanics.
- **Competitive Players:** Ages 16 to late 30s looking for skill-based
  gameplay with perfect timing windows, team coordination, and
  high-level strategic depth.
- **Spectators/Streamers:** Fast-paced matches with clear visual
  communication make for engaging content and tournament play.

**Development Team Audience**

Designers, TypeScript/Node engineers, sprite artists, technical artists
(shaders), audio, QA, community

## 2) PROJECT GOALS

### 2.1 High Concept (One-liner)

### Hurl your discus in lightning-fast team battles where split-second timing decides who's victorious---and who gets disintegrated.

### 2.2 Core Pillars

1.  **Arcade Purity:** CPS2-era clarity (1992--2003) --- minimal UI,
    maximal feel.
2.  **Authoritative Netcode:** Server decides hits/tags; clients predict
    only movement.
3.  **Modular Structure:** One mechanic per file; JSON-only tuning.
4.  **Readability First:** Trails, outlines, and damage states
    communicate instantly.
5.  **Accessibility Baseline:** Colorblind support, clarity modes, and
    remapping are core features (Microsoft guidance).

### 2.3 Success Criteria ("Definition of Done")

- Throw/Block/Dodge/Catch/Respawn loops implemented and verified.
- Client/server determinism for collisions & scoring.
- **Colorblind readability** passes complete; palette & outline options
  shippable.
- **Electron Build = Release Candidate milestone** packaged and QA'd.
- ≥60 FPS (target), ≤120 ms end-to-end input times on reference
  machines.
- **v1 physics = Arcade (Phaser 4)**; Arcade Physics is the simpler,
  lightweight system designed for \"arcade\" or \"retro\" style games.
- **Spectator Mode & Replay pipeline**: operational with **Match Data
  Recorder**.

### 2.4 Platforms

- **Primary:** Electron desktop (Windows/macOS).
- **Testing/Dev:** Chrome desktop.
- **Secondary:** Web demo / LAN play.

### 2.5 Business/Commercial (for later)

- Distribution: Steam, itch.io, Arcade Cab
- Monetization: cosmetics-only, Arcade Mode allows for insert coin to
  extend invulnerability window and add special glow.
- Community: Leaderboards, tournaments, Discord, highlight reels via
  replay export.

## 3) WORLD FLAVOR & THEME

Vibes echo retro-future grids and energy: bright lanes, electric
hazards, floating drones, chrome-and-glow UI. Theme reinforces
readability: colors map to teams and clarity modes.

## 4) PRODUCTION PLAN & MILESTONES

### 4.1 Milestones

  -----------------------------------------------------------------------------------
  Phase           Focus                      Definition of Done
  --------------- -------------------------- ----------------------------------------
  **Vertical      Core movement,             Physics feel locked; debug overlays;
  Slice**         Throw/Block/Dodge/Catch,   single-machine mock match, squares and
                  basic arena                circles; some server need
                  (squares/circles)          

  **Alpha**       Colyseus authoritative     Stable 60 Hz sim; snapshots 20--30 Hz;
                  server, Rooms/Lobby, 2-8   reconciliation proven, sketched artwork
                  players                    

  **Beta**        Menus, customization,      Full loop; colorblind mode; Match Data
                  accessibility, hazards,    Recorder operational; sketched artwork
                  Spectator/Replay           with some effects

  **RC ---        Packaging, settings,       Electron installer; settings manager
  Electron        perf + compat passes       hooks; QA checklists green
  Build**                                    
  -----------------------------------------------------------------------------------

**Scope Guards**

- Phaser 4 **Arcade** only in v1
- Modular Programming, Single Responsibility Principal/Separation of
  Concerns and **no DOM/Electron code** inside mechanics.
- All gameplay numbers in **/src/config** JSON with schema.

### 4.2 Workflow, Tools, & Roles

- **Repo**: GitHub; LFS for large art/audio.
- **Build**: Vite (client), electron-builder (packaging).
- **Lang**: TypeScript (client/server).
- **Tracking**: Issues by feature/scene/module; playtest notes weekly.
- **QA**: Headless server tests; latency harness; physics overlay; audio
  loop validation.
- **Roles**: Design, Programming, Art, Tech Art (shaders), Audio, QA,
  Community.

### 4.3 Risks & Mitigations

- **Net instability** → server authoritative; client prediction only for
  movement; reconciliation.
- **Art scope creep** → layered runtime with optional **on-demand
  compositing**; cache by recipe hash.

### [4.4 Next Steps (Kickoff List)]{.mark}

1.  [Lock Phaser 4 project skeleton & config schema @ 60/120 Hz.]{.mark}
2.  [Implement **Config Loader** (base/dev/prod + JSON Schema).]{.mark}
3.  [Build physics debug overlay (tunable colors/widths).]{.mark}
4.  [Implement **Login → Lobby → Room → Match** flow.]{.mark}
5.  [Add **Universal FX Creator & Destroyer** hooks.]{.mark}

## 5) GAMEPLAY OVERVIEW

### 5.1 Player Count & Modes

- **Online Multiplayer** (authoritative server; room codes, lists).
- **LAN Multiplayer** (same stack; IP connect; optional discovery).
- **Arcade Mode** (single machine, multiple controllers; local sim
  loopback; no network).

### 5.2 Session Length & Flow

- Match Timer governs round (e.g., 3:00 default).
- Score = "disintegrations" of opponents by threatening disc.
- **Mercy End**: early end if lead ≥ threshold (JSON tunable).
- **Sudden Death**: optional tiebreaker (toggle in Options).

### [5.3 Player Journey (Narrative)]{.mark}

[Boot → faux "memory check" → publisher logos → **Start Screen** (Local
/ Multiplayer / Options).]{.mark}

[**Local/Arcade path:** 8 "Press Start" prompts; joining anchors a
gamepad slot.]{.mark}

[Character select (masc/fem; color); timed; CPU picks if
timeout.]{.mark}

[**Team Select Zones** on the actual grid: stand on areas to join teams;
5th zone = **Free For All (FFA)**; timer locks teams.]{.mark}

[Staging (movement on, attacks off) → **Round Start**.]{.mark}

[End-of-match: losing teams disintegrate; results & breakdown.]{.mark}

## 6) CORE MECHANICS

**Notation:** Cross-references like \[Glossary.Throw\],
\[Glossary.Perfect Block\] refer to terms in the Glossary.

### 6.1 Input & Movement

- **8-way** movement (D-pad or stick treated as 8-way).
- Buttons: **Throw**, **Block**, **Dodge**, **Start**.
- Players **body-block** each other; opposing lanes "stall & slide"
  diagonally.
- Players "stall & slide" diagonally on wall / barriers.

### 6.2 Discus States & Actions

- \[Glossary.Threat Mode\] (active kill state) → \[Glossary.Inert Mode\]
  (auto-return).
- **Throw**: tap → fire in movement direction; **Charge Throw**: hold to
  root/aim; release for faster disc.
- **Curve Throw**: brief post-release control window. Quick hold throw
  after release to have joystick influence discus path.
- **Catch**: owner collides with disc (any state) to re-arm.
- Threat discs **bounce** off walls and other threat discs (toggleable),
  reducing Threat Time on impact.

### 6.3 Defense & Mobility

- **Block**: hold to face disc; deflect if facing tolerance passes.
- **Perfect Block**: 3-frame window → disc becomes non-threat and
  returns to owner.
- **Dodge**: i-frame burst with cooldown; **Perfect Dodge**: 1--2 frames
  pre-impact (0s extra cooldown).

### 6.4 States & Transitions (Player)

- **SpawnGuard** (invulnerable, slowed, inputs locked) → **Active**.
- **ChargingThrow** (rooted/rotate) → release to emit disc.
- **Blocking** (hold) → **Deflect/Perfect Block Tap** on contact.
- **Diving** (i-frames, speed burst) → cooldown.
- **Stunned** (electric hazards) → **HazardImmunity** tag.
- **Knockback** → **Disintegrated** → **Reintegration** →
  **SpawnGuard**.
- **Disrupted** (net failure) → removed to Waiting Room with special
  animation.

**Priority (high→low):** Disrupted \>
Disintegrated/Reintegration/SpawnGuard \> Stunned/Knockback \> Diving \>
Blocking window \> ChargingThrow \> Active.

### 6.5 Scoring

- 1 point per disintegration (team or FFA).
- Threat-time extensions on successful hits (tunable).
- Mercy End & Sudden Death as Options settings.

**Score State Management (Server Authority):** - Server maintains
authoritative score state in room schema - Score updates broadcast via
dedicated `scoreUpdate` event, not continuous state sync - Client text
objects update on event to prevent score display lag/stutter from
general state synchronization delays

## 7) HAZARDS & ARENA DESIGN

### 7.1 Arena Shape & Tiles

- Standard: **rectangular, tile-based** grid.
- Randomized barriers; **outer walls** can open to reveal hazards
  (events).
- Hooks for future map packs; allow areas larger than screen (camera
  follow).

### 7.2 Hazards (All JSON-tunable)

- **Regular Wall:** blocks players; normal disc bounce;
  player_slide_enabled, disc_bounce_coeff.
- **Bouncy Wall/Bumper:** pushes players back; **pushback_iframes_ms**;
  bounce lively for discs.
- **Electric Wall/Floor:** stuns players (player_stun_ms);
  **disc_threat_penalty_s**; **post_stun_immunity_ms**.
- **Conveyor Floor:** directional drift; **conveyor_speed_mult**;
  **against_flow_speed_mult**.
- **Drone (NPC):** 8-dir animation; curved sweeps w/ sudden stops;
  fixed-length lasers; **on_destroy_threat_extend_s**.

Hazards are **annoyances**, not primary threats --- tuned to add tension
without overshadowing PvP.

### 7.3 Appearance Clusters

Grouped patterns: floor clumps, wall segments flipping to electrified,
synchronized sequences. All data-driven (tile sets + timing JSON).

## 8) CONTENT & CUSTOMIZATION

### 8.1 Character creation

- **Multiplayer**: Before player enters multiplayer waiting room, they
  create their character. After the creation process the atlases used to
  make the different layers of the costuming are "flattened" into one
  atlas. This atlas is saved to disk as player's avatar, until they
  select a new costume. It then gets copied over with new content.
- **Arcade**: When player presses start, they create character costume
  on the start screen while they wait for other players to join. Same
  outcome, their atlas gets saved and is used for the rest of their
  "quarter"
- Both modes also have a "randomize and set" when holding down the start
  button for 5 seconds.

### 8.2 Characters & Layered Rendering

- **Flipbook sprites:** No skeletal rig.
- **Multiple Atlases**: character accessories and body on separate
  atlases. They are then layered and made info one finalized atlas that
  becomes the character the player uses. Atlas gets rewritten when
  player designs new character.
- **Character Costuming**: (z-layer) body base (masc/femme) \> chest \>
  arms \> legs \> head \> laser-line
- Palette swaps via shader (preferred) or baked variants (same atlas).

**Promotion Path:** layered runtime → optional per-match **composite**
(RenderTexture) cached by recipe hash (LRU).

### 8.3 Performance Optimization for 8-Player Matches

**Sprite Batching:** Single texture atlas per character rig minimizes
draw calls - Target: All 8 players + discs in 2-3 draw calls maximum

**Texture Packing:** Use TexturePacker or similar to create dense
atlases

**Culling:** Phaser's built-in camera culling handles off-screen players
automatically

**Atlas Preloading:** Load all team atlases during lobby/loading, not
mid-match

### 8.2 Audio

- Formats: OGG/Opus for music/SFX; WAV mono for ultra-snappy cues.
- Audio sprites for micro-SFX; music loops seamless (markers).
- Mix groups: music, sfx, ui, voice (separate sliders).
- Announcer VO (arcade style); server join/exit chimes; 5-second timer
  ticks.

## 9) USER EXPERIENCE (UX)

### 9.1 Readability Goals

- **Disc trails**, team colors, and outlines for clarity.
- **Thick black outline** option for colorblind modes.
- Team color is a costume element that **cannot be changed** (except FFA
  palette alignment).

### 9.2 Menus & Flow (Data-Driven)

- **Main Menu:** Online, LAN, Arcade, Options.
- **Online:** create/join by room code/IP; browse live list.
- **LAN:** mirrors online; local IPs.
- **Arcade:** attract mode (8 press-start slots); JSON option to force
  cabinet mode.
- **Options:** remap, accessibility (Microsoft baseline), audio sliders,
  gameplay toggles (team pass-through, threaten duration), net/server
  settings, **reset defaults (from JSON)**.

### 9.3 HUD & Main Game Screen (Screen Composition)

- The **game grid** (arena) sits inside an outer wall.
- Scores/timer/round status **live within the wall width** (diegetic
  frame).
- Hazards appear on the grid; characters run & throw inside the inner
  area.

### 9.4 Physics Debug View (Data-Driven)

**/src/config/physicsDebug.json**

Owner overlay may draw a rayline for discus direction. Toggleable at
runtime; hot-reload if JSON changes.

### 9.5 Spectator & Replay (UX)

- **Spectator:** join server in read-only mode; server sends delayed
  feed (tunable).
- **Replay:** saved match streams (.replay) from authoritative
  events/snapshots; UI for browsing & playback.

## 10) ACCESSIBILITY & INCLUSIVITY

### 10.1 Colorblind & Readability (Core Requirement)

- Colorblind palettes (CVD-safe sets) and thick outline toggle.
- Team colors locked per team item; FFA uses personal palette.
- **Arcade Mode**: Long-press Start (5s) to force colorblind preset
  in-match.

### 10.2 Accessibility Implementation Guidelines

Industry best practices developed with gaming experts and the Gaming &
Disability Community, intended as design catalysts, development
guardrails, and validation checklists to ensure games are enjoyable and
playable for everyone.

**Core Guidelines for Discus (Must Have):**

**Text Display** - Minimum default text sizes and spacing; configurable
style and color options for players with low vision. - All UI text
(labels, prompts, HUD) must meet minimum size requirements and use clear
fonts. - Black outlines on text for visibility against varied
backgrounds.

**Contrast** - Sufficient contrast between text/images and backgrounds
for players with color vision deficiencies or low vision, with specific
minimum color contrast ratios. - Team colors and disc trails must
maintain accessibility across colorblind modes.

**Input** - Full button remapping for all actions (Throw, Block, Dodge,
Start). - Support for multiple input methods (keyboard/mouse,
gamepad). - Configurable hold times, toggle vs hold options for
sustained actions.

**Time Limits** - Players need adequate time to read, interpret, and
interact with UI; time limits should be adjustable or provide extension
options for players with disabilities. - Match timers and team select
countdowns should have configurable durations. - Idle timeouts should be
generous or disableable.

**Implementation Priorities for Discus:** - Audio cues for critical
states (low timer ticks, stun onset/clear, disintegration warnings). -
Defaults must be playable without configuration; all options easily
discoverable. - Settings accessible at any time without losing match
progress. - Colorblind modes functional in every build (not optional
post-launch feature).

**Difficulty & Gameplay** - Multiple difficulty options so all players
can enjoy games regardless of skill level; ability to change difficulty
without losing progress; manual and auto-save options. - Discus
implements this through tunable match parameters (Threat Time, Perfect
Windows, cooldowns).

**Core Guidelines for Discus (Nice to Have):**

**Screen Narration** - All on-screen visual information represented
aurally through screen narration for players who are blind, have low
vision, or learning disabilities. - Menu navigation, game state changes,
and critical events should support narration. - Interactive elements
should enumerate type, state, and position (e.g., "Music Volume, slider,
52%, 6 of 9").

**Visual Distractions & Motion** - Reduced motion options for players
sensitive to motion sickness. - Screen shake and camera effects should
be toggleable. - Avoid rapid flashing that could trigger seizures.

**Photosensitivity** - Games should not include images that might cause
seizures or migraines; avoid flashes exceeding three per second,
high-contrast flashing covering 20% of screen, or extended low-intensity
flashing. - Electric hazard and hit effects must be tested against these
thresholds.

**Communication** - Players with disabilities must be able to navigate
to, configure, and use communication features; the entire pathway from
launch to communication should be accessible. - Lobby chat and team
coordination features require accessible UI paths.

**Documentation** - Accessibility features should be documented on
accessible websites (WCAG 2 Level AA); use person-first language
("gamers with disabilities") rather than outdated terms like
"handicapped." - In-game help systems must follow accessibility
guidelines.

**Mental Health** - Content warnings for material that may impact mental
health; customization options to avoid sensitive content; avoid
stigmatized portrayals of characters with mental health conditions.

## 11) TECHNICAL FOUNDATION

### 11.1 Engine & Physics (Phaser 4)

- Arcade Physics (discrete solver) for v1; circle disc + rect player.
- Time step: fixed 60--120 Hz; tighter steps reduce tunneling risk.
- Manual CCD on Discus only: swept line vs rects/tiles between frames;
  reflect on hit; skin offset to prevent re-collision loops.
- Tile bias 16--24 if using tilemaps to reduce edge jitter.

**Phaser-Specific Multiplayer Patterns:**

**Player Management with Groups:** - Use `this.physics.add.group()` for
managing all remote players as a single unit - Enables batch collision
checks and simplified lifecycle management - Example:
`this.otherPlayers = this.add.group()` for all non-local players -
Groups allow efficient iteration and culling

**Background Play (Critical for Multiplayer):** - Enable
`game.stage.disableVisibilityChange = true` in game config - Keeps game
updating when browser tab loses focus - Essential: other players
continue moving even when player tabs out - Without this, returning to
tab causes jarring "teleportation" of other players

**Smooth Position Corrections with Tweens:** - Use Phaser tweens to
smooth server position corrections for remote players - Instead of:
`player.x = serverX` (jarring snap) - Use:
`this.tweens.add({ targets: player, x: serverX, y: serverY, duration: 50, ease: 'Linear' })` -
Critical for masking network jitter and prediction errors - Local player
should NOT use tweens (needs instant feedback)

**Object Pooling for Projectiles:** - Create pool of disc sprites at
scene start:
`this.discPool = this.add.group({ maxSize: 16, runChildUpdate: true })` -
Reuse sprites instead of create/destroy (reduces GC pressure) - For 8
players with 1 disc each = 8 active, but pool 16 for safety -
Enable/disable sprites instead of adding/removing from scene

### 11.2 Electron Packaging & Parity

- Same renderer code in Electron; main process handles OS (saves,
  dialogs) via IPC.
- Validate timers, focus throttling, and GPU blacklists across machines.

### 11.3 Networking Stack (Authoritative)

- Node.js + Colyseus @ 60 Hz tick; snapshots 20--30 Hz; interpolation
  buffer \~100--140 ms.
- Inputs only from clients; server owns discs, tags, scores.
- Latency compensation for perfect windows (+2 frames configurable; hard
  cap 5).

### 11.4 Data Layout & Config Loader

**Arcade Config Loader**: Separate applet that reads and writes to the
Gameplay Master JSON. Human readable entries to help tweak gameplay
needs of venders.

**Telemetry Reader**: Separate applet that pull telemetry from Telemetry
JSON either locally or through the internet. (internet, nice to have)

**/src/config/** - Base.json (defaults), dev.json, prod.json,
palettes.json, arenas/\*.json, schema.json (validation).

Config.ts merges & hot-reloads.

Gameplay Master JSON: timers/frames/speeds/stocks/palettes only (no
analytics).

Telemetry JSON: discs_thrown, disintegrations, playtime, heatmaps, geo
(opt-in/anon).

### 11.5 Tunables (Defaults; 60 Hz reference)

**Gameplay Mechanics:** - **Threatening_duration_s:** 5.0 (2--8) -
**Threat_extend_on_hit_s:** 0.75 (0--2) - **Nonthreat_return_mode:**
"until_owner_contact_or_auto-return" - **Spawn_invulnerability_s:** 3.0
(1--5) - **Dodge_iframes_frames:** 3 (1--6) - **Dodge_cooldown_s:** 10.0
(2--20) - **Perfect_dodge_cooldown_s:** 0.0 (0--5) -
**Perfect_block_window_frames:** 3 (2--5) -
**Latency_comp_frames_perfect:** 2 (0--4; hard cap total 5) -
**Frame_to_ms** = 1000 / tick_hz

**Multiplayer & Netcode (see Section 16.1 for implementation
details):** - **Client_input_history_frames:** 20 (10--30) --- How many
past input frames to store for reconciliation - **Max_expected_rtt_ms:**
500 (100--1000) --- Worst-case round-trip time for buffer sizing -
**Input_send_rate_hz:** 60 (30--120) --- How often client sends inputs
to server - **Reconciliation_epsilon_position:** 0.001 (0.0001--0.01)
--- Floating point tolerance for position matching -
**Reconciliation_epsilon_velocity:** 0.01 (0.001--0.1) --- Floating
point tolerance for velocity matching - **Error_correction_duration_s:**
0.25 (0.1--0.5) --- How long to lerp display position to true position -
**Error_correction_lerp_weight:** 0.65 (0.5--0.8) --- Lerp factor for
error smoothing (higher = slower) - **Snapshot_rate_hz:** 30 (20--60)
--- How often server sends world state snapshots -
**Interpolation_buffer_ms:** 120 (50--200) --- Client-side buffer for
smoothing remote entities - **Max_input_history_ms:** 2000 (1000--5000)
--- Auto-cleanup threshold for old inputs

### 11.6 Universal FX System (Phaser 4 Filters-Based)

**Architecture Overview:**

Discus uses a centralized FX management system built on Phaser 4's **Filters Component**. Unlike separate maker/cleanup functions per effect, this system provides two universal functions: `FXCreator` and `FXDestroyer` that handle all visual effects through a unified interface.

**Phaser 4 Filter System Foundation:**

Phaser 4 replaces the old FX pipeline with a more powerful **Filters Component** that is built into the base GameObject. Key differences from Phaser 3:

- **Component-Based:** Filters are now a standard component accessible on all GameObjects via `gameObject.filters`
- **Internal vs External Lists:** Filters are organized into `filters.internal` (pre-composite) and `filters.external` (post-composite) for flexible layering
- **Automatic Camera Management:** Phaser creates an internal filterCamera when `enableFilters()` is called
- **Better Performance:** Filters work on object-sized framebuffers (not full canvas), reducing GPU overhead

**Universal FX Creator:**

Single factory function that creates all game effects:

```typescript
FXCreator.create(config: FXConfig): FXController
```

**FXConfig Parameters:**
- `target`: GameObject, Camera, or Layer to apply effect to
- `type`: 'blur' | 'glow' | 'bloom' | 'threshold' | 'colorMatrix' | 'mask' | 'parallels' | 'displacement'
- `internal`: boolean (true = filters.internal, false = filters.external)
- `params`: effect-specific parameters from JSON config
- `duration`: optional auto-cleanup timer
- `poolKey`: optional string for effect pooling/reuse

**Available Filter Types (from Phaser 4):**
- **Blur:** Fast gaussian blur for motion trails, depth of field
- **Glow:** Outline/aura effects for disc threat states, player highlights
- **Bloom:** Bright tone spread for impact flashes, electric hazards
- **Threshold:** Isolate bright/dark areas; useful in ParallelFilters
- **ColorMatrix:** Color grading, team palette shifts, damage tints
- **Mask:** Advanced masking (replaces Phaser 3's BitmapMask)
- **Displacement:** Texture-based distortion for warping effects
- **ParallelFilters:** Run two filter chains and blend results (e.g., Bloom = Threshold+Blur with ADD blend)

**Universal FX Destroyer:**

Single cleanup function that safely removes any effect:

```typescript
FXDestroyer.remove(controller: FXController, options?: DestroyOptions): void
```

**DestroyOptions:**
- `immediate`: boolean (true = instant removal, false = fade out)
- `fadeTime`: milliseconds for graceful transition
- `returnToPool`: boolean (cache for reuse vs full destroy)
- `onComplete`: callback after removal

**Implementation Pattern:**

```typescript
// Enable filters on game object once
gameObject.enableFilters();

// Create glow effect for threat disc
const glowFX = FXCreator.create({
  target: discSprite,
  type: 'glow',
  internal: true,
  params: {
    color: 0xFF0000,
    outerStrength: 4,
    innerStrength: 0,
    knockout: false
  },
  duration: 5000,
  poolKey: 'disc-threat-glow'
});

// Modify effect over time (e.g., via tween)
scene.tweens.add({
  targets: glowFX,
  outerStrength: 8,
  duration: 500,
  yoyo: true
});

// Remove when disc becomes inert
FXDestroyer.remove(glowFX, { 
  immediate: false, 
  fadeTime: 200,
  returnToPool: true 
});
```

**Key System Features:**

1. **Lifecycle Awareness:**
   - FXCreator registers all active effects in a Scene-level registry
   - FXDestroyer hooks into Scene lifecycle events (shutdown, pause, resume)
   - Auto-cleanup on Scene destroy prevents memory leaks

2. **Object Pooling:**
   - Effects marked with `poolKey` are cached for reuse
   - Reduces `enableFilters()` overhead for frequently created objects
   - Pool warmup during loading screen for common effects

3. **Interrupt Safety:**
   - Removing an effect that's mid-tween safely cancels the tween
   - Destroying parent object auto-cleans child filters
   - Safe to call remove() multiple times on same controller

4. **JSON Configuration:**
   - All effect parameters stored in `/src/config/fx.json`
   - Presets defined by name: `FXCreator.createFromPreset('disc-threat')`
   - Hot-reload support in dev mode for visual tuning

5. **Composite Control:**
   - Set `gameObject.filtersForceComposite = true` to always render to framebuffer
   - Useful for Container alpha compositing or translucent overlays
   - Can adjust `gameObject.filterCamera.alpha` independently

**Specific Discus Use Cases:**

- **Disc Threat Trail:** Internal Blur filter + Glow on disc sprite
- **Hit Flash:** External ColorMatrix brightness spike on victim
- **Electric Hazard:** Internal Glow (blue) + displacement distortion
- **Spawn Guard:** External ColorMatrix desaturation + internal Glow (cyan)
- **Screen Shake:** Camera external filter with displacement texture
- **Perfect Block:** ParallelFilters with Threshold + Bloom, ADD blend
- **Disintegration:** Sequence of ColorMatrix (saturate→negative) + Displacement + fadeOut

**Performance Notes:**
- Internal filters work on object texture size (efficient)
- External filters work on render target size (more expensive)
- Limit to 2-3 active filters per high-frequency object (disc, player)
- Use camera filters for full-screen effects (arena hazards, state transitions)
- Profile with Phaser's built-in renderer stats during 8-player matches

**Fallback Strategy:**
- WebGL-only feature; Canvas mode has no filter support
- Fallback to atlas-based sprite animations for Canvas renderer
- Config flag: `fx_fallback_mode: 'sprites'` for compatibility testing

### 11.7 Settings Manager App (External)

- Separate UI app to manage gameplay, network, display, audio,
  accessibility settings.
- Main game exposes hooks/IPC to read/write current profile

### 11.8 Repository Shape

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

## 12) MULTIPLAYER & NETWORKING

### 12.1 Room Topology

**Architecture:** - **Gateway/Matchmaker** → routes to **LobbyRoom** or
existing **MatchRoom**. - **LobbyRoom** (20--30 Hz light sim): presence,
chat, recipes, asset manifests. - **MatchRoom** (60 Hz authoritative):
gameplay, collisions, scoring.

**Colyseus Built-In Features Used:** - Matchmaker API with `.filterBy()`
for room options (game mode, skill level, etc.) - Automatic room
creation on demand via `gameServer.define()` - `maxClients` property for
room capacity - `onJoin()` / `onLeave()` lifecycle hooks - Room
locking/unlocking based on capacity - `onDispose()` for cleanup when
empty

**Custom Implementation Required:** - Mid-round join blocking: check
game phase in `requestJoin()`, return false if match in progress -
Waiting Room holding pattern: separate room instance or "spectator"
state within MatchRoom - Match token generation and error logging system

**Join Rules:** - Matches do **not** admit new players mid-round (wait
in Waiting Room). - Desync/disruption triggers **Disrupted** animation →
removal to Waiting Room. - Rooms cleaned on empty; errors logged with
match tokens.

### 12.2 Messages

**Client → Server**

**Message Flow Diagram:**

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

**Implementation Notes:** - **Server Tick:** 60 Hz simulation.
**Snapshots:** 20--30 Hz (configurable). - **Interpolation Buffer:**
Client buffers \~100-140 ms for smooth remote player rendering. -
**Anti-Cheat:** Server validates all inputs (movement caps, cooldowns,
ownership). - **Sequence Numbers:** Essential for reconciliation (see
Section 16.1.1). - **Batching:** Optional for bandwidth optimization
(see Section 16.1.10).

### 12.3 Spectator Mode (Delay & Integrity)

**Custom Implementation Required:** - Spectators join room in special
"observer" mode (custom client flag) - Server buffers snapshots/events
and delays transmission by **N ms** (tunable) - Spectators receive same
snapshot format but time-shifted - Larger interpolation buffer
client-side to smooth delayed view - UI clearly labeled **Spectator**
with delay indicator

**Colyseus Foundation:** - Clients can connect to same room with
different roles (standard pattern) - `client.userData` can store
spectator flag - Room can track spectators separately from active
players - `room.send(client, data)` for targeted messages to specific
clients

**Benefits:** - Single code path for recording logic - Consistent data
format - Easy to add replay export without affecting spectator mode -
Shared compression and optimization

### 12.6 Fighting-Game Informed Practices

**Custom Implementation Required:**

These patterns are inspired by fighting games but must be built on top
of Colyseus's foundation.

**Perfect Windows (3-frame tolerance):** - 3 frames (vs SF6's 2) for
gentler feel - Server applies **latency compensation** +2 frames
(configurable; hard cap total 5) - **Implementation:** Server timestamps
inputs, validates against window with ping offset - Colyseus provides:
`client.userData` for storing latency, custom validation in
`onMessage()`

**Reversal Buffer-like Logic:** - After respawn/hitstun states, slightly
larger input buffer restores responsiveness - **Implementation:** Queue
inputs during locked states, process on state exit - Colyseus provides:
State machine framework via Schema, message queuing

**Client-Server Reconciliation:** - Client predicts own movement only -
Server sends authoritative position - Client reconciles (snaps to server
truth + replays unacknowledged inputs) - **Implementation:** Use
patterns from Section 16.1 Priority 1 - Colyseus provides: State
synchronization handles corrections automatically

**Optimistic Client Feedback (Feel Enhancement):** - Client shows
immediate visual/audio feedback for actions before server confirms -
Example: Disc collision → client plays impact FX and particle burst
immediately - Server confirms 50-100ms later → if wrong, client corrects
silently - Pattern:
`onDiscThrow() { playThrowAnimation(); playThrowSound(); sendInputToServer(); }` -
Server event confirms or corrects:
`onServerEvent('discHit') { if (!alreadyShown) showImpact(); }` - Makes
60-100ms network latency imperceptible to players - Critical for
maintaining arcade-speed feel over network

**Achievable Patterns:** - Input buffering and delayed execution
(custom) - Server-side input validation with latency windows (custom) -
Client-side movement prediction + server reconciliation (Colyseus +
custom) - State snapshots for correction (Colyseus built-in) -
Optimistic client feedback for impacts and actions (custom)

### 12.5 Arcade Cabinet Remote Management (Arcade-Only Module)

#### 12.5.1 Architecture Overview

The arcade cabinet remote management system is a separate module included only in arcade builds of Discus. It operates on a **pull-based, developer-controlled model** where cabinets establish persistent connections to a developer-controlled jump box, but all diagnostic and update actions are manually initiated by the developer.

**Core Design Principles:**

- **Reverse Connection Model:** Cabinets initiate outbound connections to avoid requiring arcade venues to open firewall ports or configure port forwarding
- **Developer as Operator:** All actions (telemetry pulls, updates, diagnostics) are manually triggered by the developer through a local dashboard application
- **Offline Resilience:** Cabinets function independently and buffer telemetry data locally when disconnected
- **Security by Design:** All connections use SSH key authentication, all updates require cryptographic signature verification
- **Fail-Safe Updates:** A/B partition system with automatic rollback prevents cabinets from becoming unbootable

**System Components:**

1. **Arcade Cabinet Module:** Embedded software running on each cabinet that handles tunnel establishment, telemetry collection, update reception, and diagnostic access
2. **Jump Box Server:** Small cloud VPS (DigitalOcean, AWS, etc.) that acts as a relay point where cabinets maintain persistent connections
3. **Developer Dashboard:** Local application on developer's computer that shows connected cabinets and provides controls for all management operations
4. **Update Signing System:** Developer-side tooling that cryptographically signs update packages before deployment

**Network Topology:**

Each arcade cabinet establishes a reverse SSH tunnel to the jump box on boot. The tunnel remains active as long as the cabinet has network connectivity. When the developer wants to interact with a cabinet, they connect to the jump box and then traverse through the appropriate tunnel to reach the target cabinet. This creates a secure, developer-initiated pathway without exposing any services on the cabinet to the public internet.

#### 12.5.2 Remote Access & Connectivity

**Reverse SSH Tunnel Establishment:**

When an arcade cabinet boots, the management module attempts to establish a reverse SSH tunnel to the configured jump box server. This tunnel creates a pathway back to the cabinet without requiring the venue's firewall to allow incoming connections. The cabinet uses SSH key-based authentication (no passwords) to connect to the jump box.

Each cabinet is assigned a unique device ID during build/configuration (e.g., "ARC-001", "ARC-002"). This ID determines which port the tunnel binds to on the jump box, creating a predictable addressing scheme. For example, ARC-001 might bind to port 9001, ARC-002 to port 9002, etc.

**Connection Lifecycle:**

The module monitors the tunnel connection continuously. If the connection drops (network interruption, jump box restart, etc.), the module automatically attempts reconnection using an exponential backoff strategy. Initial retry might occur after 5 seconds, then 10, 20, 40, up to a maximum interval of 5 minutes between attempts.

**Heartbeat Mechanism:**

Once connected, the cabinet sends periodic heartbeat messages through the tunnel to confirm the connection is alive and functional. These heartbeats include basic status information: device ID, current software version, uptime, and connection timestamp. The jump box logs these heartbeats, allowing the developer dashboard to display which cabinets are currently online and when they were last seen.

**WiFi Considerations:**

Since arcade cabinets are expected to use WiFi connectivity (as specified), the module must handle the realities of wireless networks: intermittent drops, reconnection after power cycling the venue's router, captive portals, etc. The module includes logic to detect when the WiFi connection itself is lost (vs. just the SSH tunnel) and attempts to re-establish WiFi before attempting to reconnect the tunnel.

**Network Resilience:**

The system is designed to tolerate extended offline periods. If a cabinet cannot connect to the jump box (venue network down, jump box maintenance, internet outage), the cabinet continues to function normally as a standalone game. Telemetry accumulates in local storage, and when connectivity is restored, the backlog is available for pulling.

#### 12.5.3 Telemetry Collection & Storage

**Metrics Definition:**

The telemetry system collects metrics defined in a JSON configuration file included in the arcade build. This file specifies exactly which data points to collect and at what intervals. Metrics fall into several categories:

- **Gameplay Metrics:** Match count, disintegrations, perfect blocks/dodges, average session length, player count distribution, game mode usage
- **Hardware Metrics:** CPU usage and temperature, GPU temperature, RAM usage, disk space remaining, system uptime
- **Error Metrics:** Crash count, exception logs, error timestamps, failed operations
- **Network Metrics:** Connection status, last successful heartbeat, disconnection events

**Collection Process:**

A background service runs continuously on the cabinet, gathering metrics at configured intervals (e.g., every 5 minutes for hardware stats, after each match for gameplay stats). These metrics are structured as JSON and appended to a local telemetry buffer stored on the cabinet's disk.

**Local Storage Management:**

The telemetry buffer has a maximum size limit (e.g., 100MB) to prevent unbounded disk usage. When the buffer approaches this limit, the oldest entries are pruned. This ensures the cabinet never runs out of disk space due to telemetry accumulation, even if disconnected from the network for weeks.

**Privacy and Anonymization:**

Telemetry is designed to be anonymous and non-invasive. No personally identifiable information (PII) is collected. Player data is aggregated (e.g., "50 matches played today") rather than individualized. Venue operators are informed of telemetry collection, and the system can be disabled entirely via a config flag if required by venue policy.

**Pull Mechanism:**

When the developer initiates a telemetry pull via the dashboard, the system connects to the target cabinet through the reverse SSH tunnel, retrieves the current telemetry buffer, saves it to the developer's local machine, and then optionally clears the cabinet's buffer. This pull operation is atomic—either all data is transferred successfully or none is removed from the cabinet.

**Telemetry Analysis:**

Once pulled to the developer's machine, telemetry data can be analyzed using standard tools (spreadsheets, databases, visualization tools). The JSON format makes it easy to import into analytics pipelines. This data informs decisions about gameplay balance, hardware requirements, reliability improvements, and feature prioritization.

#### 12.5.4 Update Deployment

**Update Package Creation:**

When the developer has a new build ready for deployment (bug fix, feature update, balance adjustment), they create an update package. This package contains the new Electron application build, any updated assets, and metadata describing the version and changes.

**Cryptographic Signing:**

Before deployment, the update package is signed using the developer's private RSA key. This signature is generated from a cryptographic hash of the entire update package, ensuring that any modification to the package after signing will be detectable. The private key is kept secure on the developer's machine and never transmitted or stored on cabinets.

**Signature Verification:**

Each arcade cabinet has the corresponding public key embedded in its build. When an update package is received, the cabinet first verifies the signature using this public key before taking any further action. If the signature is invalid (package tampered with, wrong signing key, etc.), the update is rejected entirely and logged as a failed attempt.

**A/B Partition System:**

The cabinet's storage is configured with two system partitions: Partition A and Partition B. At any given time, one partition holds the currently running system (the "active" partition) and the other is available for updates (the "inactive" partition).

When an update is initiated:
1. The update is downloaded and written to the inactive partition
2. Signature verification occurs before any modification to the partition
3. If verification passes, the update is extracted and installed to the inactive partition
4. The bootloader is configured to boot from the newly updated partition on next restart
5. The cabinet reboots into the updated partition

**Rollback Safety:**

After rebooting into the updated partition, the cabinet has a timeout period (e.g., 120 seconds) to successfully initialize and re-establish its heartbeat connection. If this doesn't occur within the timeout, the bootloader automatically reverts to booting from the previous partition, effectively rolling back the update.

This mechanism protects against updates that cause boot failures, kernel panics, critical crashes, or configuration errors that prevent the system from starting. The cabinet essentially "self-heals" by reverting to the last known-good state.

**Manual Rollback:**

The developer can also manually trigger a rollback through the dashboard if an update was technically successful but causes unexpected behavior. This swaps the active partition back to the previous version.

**Version Tracking:**

Each build includes version metadata (e.g., v1.2.4). The cabinet reports its current version in heartbeat messages, allowing the dashboard to show at a glance which cabinets are running which versions. This helps identify cabinets that failed to update or need manual intervention.

**Update Staging:**

Updates can be deployed to individual cabinets or groups of cabinets. The developer might choose to update a single test cabinet first, verify it works correctly for a few days, then roll out to the full fleet. The dashboard provides controls for selecting update targets.

#### 12.5.5 Remote Diagnostics

**SSH Shell Access:**

When troubleshooting is needed, the developer can open a standard SSH terminal session to the cabinet through the reverse tunnel. This provides full command-line access to the system, allowing the developer to run diagnostic commands, inspect processes, check system logs, and manually test components.

**Log Access:**

The cabinet maintains standard system logs (boot logs, application logs, error logs). The developer can either stream these logs in real-time during an SSH session or download entire log files to their local machine for offline analysis. Log files are rotated to prevent unbounded growth (e.g., keep last 7 days of logs).

**System Information API:**

A lightweight HTTP server runs on the cabinet, accessible only through the SSH tunnel, that provides current system information via simple API endpoints. The developer dashboard can query this API to display:

- Current CPU, GPU, RAM usage
- Disk space available
- System temperature
- Running processes
- Network interface status
- Current game state (idle, in-match, etc.)

This information helps quickly assess cabinet health without requiring manual SSH commands.

**Screenshot/Screen Capture:**

For visual debugging (UI issues, rendering problems), the developer can request a screenshot of what's currently displayed on the cabinet screen. This captures the framebuffer and transfers it through the tunnel to the dashboard, allowing the developer to see exactly what a player sees without requiring photos from venue staff.

**Process Control:**

Through the diagnostic interface, the developer can restart the game application, restart specific services, or reboot the entire cabinet. This allows recovery from hung states or memory leaks without requiring on-site intervention.

**Configuration Adjustment:**

Some configuration parameters can be adjusted remotely for testing purposes. For example, the developer might want to temporarily enable debug logging, adjust frame rate limits, or modify gameplay parameters on a specific cabinet to diagnose reported issues. These adjustments can be made through the diagnostic interface and either persisted or reset on next reboot.

#### 12.5.6 Security Model

**Authentication:**

All connections between components use SSH key-based authentication. Passwords are never used. Each cabinet is provisioned with a unique SSH key pair during manufacturing/setup. The private key stays on the cabinet, the public key is registered with the jump box.

The developer's machine also has its own SSH key pair for connecting to the jump box. This creates a chain of trust: developer → jump box → cabinet, where each hop is authenticated cryptographically.

**Access Control:**

Only the developer's SSH keys are authorized to connect to the jump box. Even if someone discovers the jump box's IP address, they cannot connect without the correct private key. Similarly, only the jump box can accept incoming tunnel connections from cabinets.

**Isolation:**

Each cabinet's tunnel is isolated to its own port/channel on the jump box. Cabinet A cannot access Cabinet B's tunnel. The developer explicitly chooses which cabinet to connect to from the dashboard.

**Update Authenticity:**

The signature verification system ensures that cabinets will only install updates created by the developer. Even if an attacker compromised a cabinet or the network, they could not push malicious updates without the developer's private signing key.

**Audit Trail:**

All connections to the jump box are logged with timestamps. All update deployments are logged on both the developer's machine and the cabinet. All remote diagnostic sessions are logged. This creates an audit trail for security review and troubleshooting.

**Jump Box Hardening:**

The jump box server is configured with minimal attack surface: only SSH port open, key-based authentication only, automatic security updates enabled, fail2ban for brute-force protection, and restrictive firewall rules. Regular monitoring ensures the jump box remains secure.

**Key Management:**

The developer's update signing private key is stored encrypted at rest and backed up to secure offline storage. If the key is ever compromised, a new key can be generated and cabinets can be updated (via physical access if necessary) to trust the new key.

#### 12.5.7 Developer Dashboard

**Dashboard Purpose:**

The developer dashboard is a local application (desktop app or locally-run web interface) that provides a unified interface for managing the entire fleet of arcade cabinets. It abstracts away the underlying SSH and tunnel complexity, presenting a clean interface for common operations.

**Fleet Overview:**

The dashboard's main view shows a list of all registered cabinets with their current status:

- Device ID and assigned location/name
- Online/offline status
- Current software version
- Last heartbeat timestamp
- Quick action buttons for common operations

This overview allows the developer to see the entire fleet's health at a glance and identify cabinets that may need attention (offline for extended period, running old version, etc.).

**Connection Management:**

The dashboard maintains an active connection to the jump box and monitors which cabinet tunnels are currently established. It updates the fleet status view in real-time as cabinets connect and disconnect.

**Operation Initiation:**

From the dashboard, the developer can:

- Select one or more cabinets and initiate a telemetry pull
- Select cabinets and push an update package
- Open an SSH terminal to a specific cabinet
- View system information for a cabinet
- Request a screenshot
- Download logs
- Restart the game or reboot the cabinet

Each operation provides feedback about progress and success/failure.

**Telemetry Visualization:**

The dashboard can load previously pulled telemetry data and display basic visualizations: total matches per cabinet over time, hardware utilization trends, error frequency, etc. This helps identify patterns or problems across the fleet.

**Update Management:**

The dashboard includes tools for:

- Creating and signing update packages
- Selecting update targets (individual cabinets, groups, or entire fleet)
- Monitoring update progress
- Viewing update history and rollback status

**Configuration:**

The dashboard stores its own configuration: jump box connection details, local paths for telemetry storage, update signing key location, etc. This configuration is separate from the game itself and exists only on the developer's machine.

#### 12.5.8 Configuration Schema

**Telemetry Configuration (telemetry.json):**

This file defines what data to collect and how often. It specifies:

- Collection intervals for different metric categories
- Maximum local storage buffer size
- Specific metrics to enable/disable within each category
- Data retention policies (how long to keep old telemetry before pruning)

This file is included in the arcade build and can be updated via the update deployment system. Different builds might have different telemetry configs for testing purposes.

**Management Configuration (management.json):**

This file contains the cabinet-specific settings for the remote management system:

- Device ID (unique identifier for this cabinet)
- Location/name (human-readable identifier)
- Jump box connection details (hostname, port, username)
- Reconnection and heartbeat intervals
- Telemetry pull behavior (auto-clear after pull, etc.)
- Update system configuration (public key path, rollback timeout, version constraints)

This file is provisioned during cabinet setup/manufacturing and rarely changes. If it does need to change (e.g., switching to a different jump box), an update package can include a new management.json.

**Security Configuration:**

Embedded in the build or stored in protected system locations:

- SSH public key for jump box authentication
- Update signature verification public key
- Authorized developer SSH public keys

These are not meant to be user-editable and are protected by file system permissions.

**Dashboard Configuration:**

On the developer's machine, the dashboard stores:

- Jump box connection credentials (developer's SSH key)
- List of known cabinets and their device IDs
- Update signing private key location
- Local paths for telemetry storage and log archives
- UI preferences and saved filters

This configuration is stored in a standard location on the developer's system and is backed up as part of the developer's normal backup procedures.

#### 12.5.9 Integration with Core Game

**Build Variants:**

The remote management module is compiled into arcade-only builds and completely absent from standard desktop, LAN, or online builds. This is controlled via build flags and conditional compilation, ensuring the additional dependencies and code paths don't bloat non-arcade versions.

**Resource Isolation:**

The management module runs as a separate process or service alongside the game, not integrated into the game's main loop. This isolation ensures that telemetry collection, heartbeat maintenance, and other management tasks don't impact game performance or introduce frame drops.

**Graceful Degradation:**

If the management module encounters errors (can't connect to jump box, disk full, etc.), it logs the errors but does not crash or interfere with the game. The game continues to function normally even if all management features are unavailable.

**Configuration Loading:**

The game's config system is extended to load management.json and telemetry.json during initialization in arcade builds. These configs are validated on load and fallback to safe defaults if corrupted or missing.

**Telemetry Collection Points:**

The core game code includes instrumentation points where gameplay events (match end, disintegration, perfect block, etc.) trigger telemetry recording. These points call into the management module's telemetry API if available, or no-op silently in non-arcade builds.

**Update Application:**

When an update is applied, the game is shutdown gracefully, the partition swap occurs, and the cabinet reboots. On reboot, the updated version initializes normally and resumes operation. From the game's perspective, it's just a normal startup, but the underlying system has changed.

#### 12.5.10 Deployment and Provisioning

**Cabinet Provisioning:**

When a new arcade cabinet is prepared for deployment:

1. The arcade build of Discus is installed to Partition A
2. A unique device ID is generated and written to management.json
3. SSH keys are generated for this cabinet and the public key is registered with the jump box
4. The update verification public key is embedded in the system
5. Partition B is initialized as empty/default
6. The cabinet is booted and tested to confirm it connects to the jump box

This provisioning process can be automated via a setup script that handles all the necessary configuration.

**Jump Box Setup:**

The jump box is a one-time setup:

1. Provision a small VPS (1GB RAM, 10GB disk is sufficient)
2. Install Ubuntu Server (or similar)
3. Configure SSH server with key-based authentication only
4. Create user accounts for arcade tunnels
5. Set up monitoring and automatic security updates
6. Configure firewall rules (allow SSH port 22, block all else)
7. Document connection details for use in cabinet management.json files

**Developer Workstation Setup:**

The developer's machine requires:

1. SSH client installed (standard on macOS/Linux, available for Windows)
2. Developer dashboard application installed
3. SSH keys generated and registered with jump box
4. Update signing private key generated and secured
5. Configuration of jump box connection details in dashboard

**Venue Deployment:**

When deploying a cabinet to a venue:

1. Physically install and set up the cabinet
2. Connect cabinet to venue WiFi
3. Power on and verify game boots correctly
4. Check dashboard to confirm cabinet appears online
5. Pull initial telemetry to verify communication works
6. Provide venue with basic troubleshooting instructions (restart if frozen, etc.)

No special network configuration is needed from the venue beyond standard WiFi guest network access. The outbound-only connection model means IT staff doesn't need to open ports or configure routing.

## 13) DESIGN & LAYOUT --- SCREENS

Descriptions will be in separate document with diagram of player flow.

## 14) OPTIONS --- SCORE & GAME TIME

- **Match Duration** (timer).
- **Mercy Threshold** (point lead).
- **Sudden Death** (on/off).
- **Reset to Defaults** pulls from config baseline.
- Emphasize **small files** and "domain per file" construction for LLM
  stability.

## 15) GLOSSARY (CANON)

### Player Actions & States

- **Throw** --- basic disc release in movement direction.
- **Charge Throw** --- hold throw to power up and aim.
- **Curve Throw** --- brief post-release influence over disc path.
- **Block** --- held action; deflects if facing correctly.
- **Perfect Block** --- 3-frame window; nullifies threat and returns
  disc.
- **Dodge** --- i-frame burst; prevents pass-through.
- **Perfect Dodge** --- 1--2 frames before impact; enhanced evasion (0s
  extra CD).
- **Dodge Cooldown** --- time before next dodge.
- **Disintegration** --- after being hit by Discus, player is removed
  from match for a short period
- **Respawn** --- return after disintegration; short invulnerability.
- **Win/Lose Pose** --- post-match animations.
- **Taunt Pose** --- Start tap triggers taunt; **resets dodge timer**
  but locks inputs (vulnerable).
- **Disrupted Pose** --- animation when net integrity fails before
  removal.

### Discus States & Rules

- **Threat Mode** --- active; disintegrates opponents.
- **Inert Mode** --- returning; passes through everything to owner.
- **Threat Time** --- duration of threat; extends on hit (tunable).
- **Bounce** --- reflections off walls/objects/threat discs (toggle).
- **Deflection** --- block-caused direction change.
- **Catch** --- owner contact to recover disc.
- **Stock** --- future power-up allowing multiple discs.

### Match & Scoring

- **Point** --- awarded on disintegration.
- **Mercy End** --- early end at lead threshold.
- **Sudden Death** --- tiebreaker mode.
- **Match Timer** --- governs round duration.
- **Win/Lose/Tie** --- outcomes at time or sudden death rule.

### Hazards & Environment

- **Regular Wall** --- blocks players; normal disc bounce.
- **Bouncy Wall/Bumper** --- pushes players back; lively disc bounce.
- **Electric Wall/Floor** --- stuns players; shortens disc threat time.
- **Conveyor Belt Floor** --- forced movement.
- **Drone** --- flying NPC; curved sweeps; fixed-length lasers.
- **Hazard Clusters** --- grouped patterns.
- **Dynamic Walls** --- edges open to hazards.

### Menus & Modes

- **Arcade Mode** --- couch/co-op with 8 gamepads; attract style.
- **LAN Multiplayer** --- local network rooms.
- **Online Multiplayer** --- internet rooms with lobby staging.
- **Waiting Room** --- lobby where players move/chat before match.
- **Team Select Zones** --- stand-to-choose teams; 5th zone for **FFA**.
- **Free For All (FFA)** --- individual scoring; no teams.

## 16) OPEN QUESTIONS & NEXT STEPS

- Final hazard timing sets per arena?
- Cosmetic pipeline (server-compose vs client-compose fallback) default?
- Tournament camera presets for large maps?
- Streaming overlays: safe HUD channels for casters?

------------------------------------------------------------------------

## 17) SOURCES & REFERENCES

This document incorporates research and best practices from the
following sources, which informed the multiplayer architecture (Section
12) and implementation patterns (Section 16.1).

### Multiplayer Networking - Core Theory

**Gabriel Gambetta - Fast-Paced Multiplayer Series** - Part I:
Client-Server Game Architecture\
https://www.gabrielgambetta.com/client-server-game-architecture.html -
Part II: Client-Side Prediction and Server Reconciliation (CRITICAL)\
https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html -
Part III: Entity Interpolation\
https://www.gabrielgambetta.com/entity-interpolation.html - Part IV: Lag
Compensation\
https://www.gabrielgambetta.com/lag-compensation.html - Live Interactive
Demo\
https://www.gabrielgambetta.com/client-side-prediction-live-demo.html

**4AM Games - Smooth Server Reconciliation** - Blog Post with
Interactive Demo\
https://fouramgames.com/blog/fast-paced-multiplayer-implementation-smooth-server-reconciliation -
Demonstrates error correction lerp technique used in Section 16.1.3

**Wikipedia - Client-side Prediction** -
https://en.wikipedia.org/wiki/Client-side_prediction - Historical
context (Duke Nukem 3D, QuakeWorld)

**DanielJimenezMorales - Client-Side Prediction Deep Dive** -
https://danieljimenezmorales.github.io/2025-06-20-client-side-prediction-and-server-reconciliation/ -
Performance analysis and re-simulation costs

**Game Development Stack Exchange - Networking Questions** - Forced
Movement During Prediction\
https://gamedev.stackexchange.com/questions/192385/networking-a-fast-paced-game-2d-forced-movement-server-client -
Timed Events in Prediction/Reconciliation\
https://gamedev.stackexchange.com/questions/136094/how-do-you-handle-timed-events-in-prediction-reconciliation-client-model

**GameDev.net Forums** - Combining Server Reconciliation and Client-Side
Prediction\
https://www.gamedev.net/forums/topic/705066-combining-server-reconciliation-and-client-side-prediction/

**Game Dev FAQs** - Reconciling Differing Client Predictions\
https://gamedevfaqs.com/reconciling-differing-client-predictions-in-fast-paced-multiplayer-games/

**Medium - Christian Tucker** - Seamless Fast-Paced Multiplayer in
Unity3D (patterns apply to Phaser)\
https://medium.com/@christian.tucker_68732/seamless-fast-paced-multiplayer-in-unity3d-implementing-client-side-prediction-ab520bf49bd1

### Colyseus Framework

**Colyseus Official Documentation** - Main Documentation\
https://docs.colyseus.io/ - Phaser Tutorial - Part 1: Basic Player
Movement\
https://docs.colyseus.io/tutorial/phaser/basic-player-movement - Phaser
Tutorial - Complete Series\
https://docs.colyseus.io/tutorial/phaser/ - Learn Colyseus with Phaser\
https://learn.colyseus.io/phaser/1-basic-player-movement - Main Learn
Portal\
https://colyseus.io/learn/phaser/

**Colyseus Community & Examples** - Colyseus Discussion Group - Phaser 3
Integration\
https://discuss.colyseus.io/topic/143/phaser-3-integration-server-and-client -
Phaser Discourse - Real-Time Multiplayer with Physics\
https://phaser.discourse.group/t/phaser-3-real-time-multiplayer-game-with-physics/1739 -
Phaser Discourse - Multiplayer Physics Approaches\
https://phaser.discourse.group/t/how-to-approach-phaser-3-multiplayer-with-physics/1579

**Colyseus Code Examples** - Official Tutorial Repository\
https://github.com/colyseus/tutorial-phaser - PatBG's Tutorial Fork\
https://github.com/PatBG/tutorial-phaser-colyseus - Phaser 3 Multiplayer
with Physics (MatterJS and Arcade)\
https://github.com/yandeu/phaser3-multiplayer-with-physics - Loversama's
Fork\
https://github.com/loversama/phaser3-multiplayer-with-physics

**Colyseus Articles & Blogs** - RAVALMATIC - Colyseus Review\
https://www.ravalmatic.com/colyseus-an-uncomplicated-library-for-multiplayer-games/ -
ResearchHub - Colyseus Client Template Guide\
https://researchhub.blog/colyseus-client-template-build-multiplayer

### Phaser Framework

**Phaser Physics & Groups** - CodeCaptain - Shooting Bullets in Phaser 3
Using Arcade Physics Groups\
https://codecaptain.io/blog/game-development/shooting-bullets-phaser-3-using-arcade-physics-groups/696 -
Phaser Discourse - Shooting Bullets Tutorial\
https://phaser.discourse.group/t/shooting-bullets-in-phaser-3-using-arcade-physics-groups/5368 -
HTML5GameDevs Forum - Shooting Bullets\
https://www.html5gamedevs.com/topic/44805-shooting-bullets-in-phaser-3-using-arcade-physics-groups/ -
Phaser Official News - Shooting Bullets Tutorial\
https://phaser.io/news/2016/03/shooting-bullets-tutorial

**Phaser Game Examples** - Emanuele Feronato - Radical Game with Arcade
Physics\
https://emanueleferonato.com/2019/04/15/radical-html5-game-prototype-built-with-phaser-and-arcade-physics-updated-to-phaser-3-featuring-arcade-groups-and-object-pooling/ -
Phaser Games - Physics for Beginners\
https://phasergames.com/phaser-3-physics-beginners/

**Phaser Multiplayer Templates** - Ourcade - Multiplayer Tic-Tac-Toe
Starter\
https://ourcade.co/templates/multiplayer-tic-tac-toe-starter/

### Accessibility Guidelines

**Xbox Accessibility Guidelines (XAG)** - Section 10.2 accessibility
implementation guidelines are based on research from Microsoft's Xbox
Accessibility Guidelines and the Gaming & Disability Community - These
guidelines inform text display, contrast, input remapping, time limits,
photosensitivity, and mental health considerations

### Additional Context

**Colyseus vs Direct Implementation** - While some sources discussed
direct Node.js + WebSocket implementations, this GDD specifically chose
Colyseus for its room management, state synchronization, and matchmaking
features - The framework reduces boilerplate while maintaining full
control over authoritative server logic

**Fighting Game Netcode Influence** - Section 12.6 patterns are inspired
by fighting game netcode (SF6, GGPO) adapted for DISCUS's authoritative
server model - Frame-perfect timing windows and rollback-inspired
reconciliation provide arcade-speed responsivenes
