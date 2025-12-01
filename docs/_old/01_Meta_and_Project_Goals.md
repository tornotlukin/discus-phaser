
# Discus — Game Design Document  
## Part 1 – Meta & Project Goals

### 1. Metadata & Purpose
**Title:** *Discus*  
**Version:** Draft v12  
**Owner:** Internal Design Doc System / User (Project Lead)  
**Status:** In Progress – Living Document  
**Type:** Digital Arcade Action / Multiplayer Arena Game  

**Purpose of Document:**  
This GDD serves as the single canonical source of truth for the design and development of *Discus*, a top-down arcade arena game built with **Phaser 4**, **Node.js**, and **Colyseus**.  
It unifies all creative, technical, and accessibility design, ensuring that every system—from physics to UI—is reproducible and LLM-readable for automation and code generation.  
All other exports (JSON, DOCX, etc.) derive directly from this canonical prose.

**Target Audience:**  
- Game Designers  
- Programmers (TypeScript / Node / Phaser 4)  
- Artists & Animators (Sprite / Atlas Pipeline)  
- Sound Designers and Composers  
- QA / Playtesters  
- Marketing and Community Managers  

---

### 2. Project Goals

#### High Concept
Fast-paced 8-way arena battler where players throw, curve, and deflect discs in a tight competitive grid.  
Imagine *Tron*-style speed and precision meets *Street Fighter*’s timing mind-games, played with arcade-era clarity and modern rollback-ready networking.

#### Core Pillars
1. **Skill-Readable Combat** – Every action should be visible, timed, and counterable.  
2. **Arcade Purity** – Retro clarity, instant feedback, no bloat.  
3. **Fair Online Play** – Authoritative server, rollback/latency compensation windows.  
4. **LLM-Friendly Structure** – JSON-tunable data and modular mechanics for safe AI-assisted iteration.  
5. **Accessibility by Design** – Colorblind and clarity modes treated as core requirements.  

---

#### Success Criteria
- **Core Gameplay Lock:** Full set of player states (throw, block, dodge, respawn) function to spec.  
- **Network Parity:** Same mechanics perform identically online, LAN, and arcade mode.  
- **Accessibility Compliance:** Colorblindness and readability options verified per Microsoft Gaming Accessibility Standards.  
- **Electron Build Milestone:** “Electron Build” equals Release Candidate (Prototype → Alpha → Beta → **Electron Build = RC**).  
- **Performance Budget:** ≥ 60 FPS on desktop, ≤ 120 ms input latency end-to-end.  
- **Scope Guard:** v1 uses Arcade Physics; switching to Matter requires explicit milestone approval to avoid scope creep.  

---

#### Audience & Platform
- **Primary Platform:** Desktop (Electron build using Chromium runtime)  
- **Testing Environment:** Chrome browser for development and QA.  
- **Secondary Platform:** Web build for public demos or LAN testing.  
- **Player Base:** Competitive and casual PvP players aged 16-40; arcade enthusiasts; indie multiplayer fans.  

---

#### Business / Commercial Goals
- **Distribution:** Steam + itch.io + direct Electron installer.  
- **Monetization:** Cosmetic skins and custom arenas only — no P2W.  
- **Community Engagement:** Public Discord server, seasonal tournaments, leaderboards.  
- **Brand Identity:** “Retro precision meets modern modularity.”  

---

### 3. Production Goals & Milestones

#### Timeline (Major Milestones)
| Milestone | Deliverable | Notes |
|------------|--------------|------|
| Prototype | Playable arcade physics loop with dummy art (squares + circles). | Physics and input only — test responsiveness. |
| Alpha | Basic multiplayer + hazards + UI. | Server authoritative Colyseus rooms with LAN support. |
| Beta | Full menu flow + character customization + accessibility passes. | LLM safe code structure enforced. |
| Electron Build (RC) | Final packaging, installer, QA. | Considered definition of “done.” |

---

#### Workflow & Toolchain
- **Version Control:** GitHub / Git LFS for assets.  
- **Build Tools:** Vite + Electron-Builder.  
- **Code:** TypeScript (Phaser 4 + Node.js).  
- **Testing:** Unit tests for mechanics modules; integration tests for client-server sync.  
- **Design Docs:** Markdown + JSON canonical sources under /docs/.  
- **Playtest Loop:** Weekly local sessions (Arcade Mode first, then LAN/Online).  
- **Risk Management:** Avoid feature creep and ensure LLM outputs stay within one mechanic per file policy.  

---

#### Open Questions
- What is the ideal match duration for competitive play (3 vs 5 minutes)?  
- Should team hazard penalties count toward score differentials?  
- Which future story mode hooks need reserved API stubs now?  

---

#### Next Steps
1. Lock Phaser 4 build environment and Arcade Physics baseline.  
2. Implement LLM-safe config and tuning loader.  
3. Develop 8-direction animation test suite with placeholder sprites.  
4. Finalize colyseus server login and room creation flows (per best practice docs).  
5. Prepare JSON schemas for balance tuning and debug color maps.  

---

*(End of Part 1 – Meta & Project Goals)*
