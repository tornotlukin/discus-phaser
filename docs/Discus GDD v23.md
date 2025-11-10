# DISCUS --- GAME DESIGN DOCUMENT

### Version 23

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

### 11.6 Universal FX (Creator/Destroyer)

- **FX Creator:** centralized factory for trails, glows, hit flashes,
  screen shake.
- **FX Destroyer:** pooled cleanup, interrupt-safe teardown, scene
  lifecycle aware.
- All configurable (JSON): durations, colors, intensities.
- Phaser 4 FX pipelines preferred; fallback atlas animations available.

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
