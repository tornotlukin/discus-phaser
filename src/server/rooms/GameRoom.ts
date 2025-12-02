import { Room, Client } from "colyseus";
import { RoomState } from "../../shared/schemas/RoomState";
import { PlayerSchema } from "../../shared/schemas/PlayerSchema";
import { DiscSchema } from "../../shared/schemas/DiscSchema";

// ===========================================
// TUNABLE CONSTANTS - Modify these values
// ===========================================
const TICK_RATE = 60;
const PLAYER_SPEED = 200;

// Disc settings
const DISC_SPEED = 400;
const DISC_RETURN_SPEED = 500;
const DISC_BOUNCE_DAMPING = 1.0;      // 1.0 = no energy loss, 0.9 = 10% loss per bounce

// Threat timing (in milliseconds)
const THREAT_DURATION = 5000;          // 5 seconds for testing (change to 30000 for production)
const THREAT_EXTEND_ON_HIT = 5000;     // Extend threat time by 5 sec on hit
const CATCH_DISTANCE = 30;             // Distance to catch disc
const THROW_GRACE_PERIOD = 300;        // ms before owner can catch their own disc

interface PlayerInput {
  x: number; // -1, 0, or 1
  y: number; // -1, 0, or 1
}

export class GameRoom extends Room<RoomState> {
  maxClients = 2;
  private tickInterval!: ReturnType<typeof setInterval>;
  private lastTickTime: number = Date.now();
  private discThrowTimes: Map<string, number> = new Map(); // Track when each disc was thrown

  onCreate(): void {
    this.setState(new RoomState());

    // Handle player input messages
    this.onMessage("input", (client, input: PlayerInput) => {
      this.handlePlayerInput(client.sessionId, input);
    });

    // Handle throw disc message
    this.onMessage("throw", (client, data: { targetX: number; targetY: number }) => {
      this.handleThrowDisc(client.sessionId, data.targetX, data.targetY);
    });

    // Start physics simulation tick
    this.tickInterval = setInterval(() => this.tick(), 1000 / TICK_RATE);

    console.log("GameRoom created");
  }

  onJoin(client: Client): void {
    console.log(`Player ${client.sessionId} joined`);

    const player = new PlayerSchema();
    player.sessionId = client.sessionId;

    // Spawn positions on opposite sides
    const playerCount = this.state.players.size;
    if (playerCount === 0) {
      player.x = 100;
      player.y = this.state.arenaHeight / 2;
    } else {
      player.x = this.state.arenaWidth - 100;
      player.y = this.state.arenaHeight / 2;
    }

    this.state.players.set(client.sessionId, player);

    // Create disc for player
    const disc = new DiscSchema();
    disc.id = `disc_${client.sessionId}`;
    disc.ownerId = client.sessionId;
    disc.x = player.x;
    disc.y = player.y;
    disc.state = "held";
    disc.threatTimeMax = THREAT_DURATION;
    disc.threatTimeRemaining = 0;
    this.state.discs.set(disc.id, disc);
  }

  onLeave(client: Client): void {
    console.log(`Player ${client.sessionId} left`);

    // Remove player and their disc
    this.state.players.delete(client.sessionId);
    this.state.discs.delete(`disc_${client.sessionId}`);
  }

  onDispose(): void {
    clearInterval(this.tickInterval);
    console.log("GameRoom disposed");
  }

  private handlePlayerInput(sessionId: string, input: PlayerInput): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    // Normalize diagonal movement
    let dx = input.x;
    let dy = input.y;
    if (dx !== 0 && dy !== 0) {
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      dx /= magnitude;
      dy /= magnitude;
    }

    player.velocityX = dx * PLAYER_SPEED;
    player.velocityY = dy * PLAYER_SPEED;
  }

  private handleThrowDisc(sessionId: string, targetX: number, targetY: number): void {
    const player = this.state.players.get(sessionId);
    const disc = this.state.discs.get(`disc_${sessionId}`);

    if (!player || !disc || !player.hasDisc) return;

    // Calculate direction to target
    const dx = targetX - disc.x;
    const dy = targetY - disc.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude === 0) return;

    // Set disc velocity toward target
    disc.velocityX = (dx / magnitude) * DISC_SPEED;
    disc.velocityY = (dy / magnitude) * DISC_SPEED;
    disc.state = "threat";
    disc.threatTimeRemaining = disc.threatTimeMax;
    player.hasDisc = false;

    // Record throw time for grace period
    this.discThrowTimes.set(disc.id, Date.now());
  }

  private tick(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastTickTime) / 1000;
    const deltaMs = now - this.lastTickTime;
    this.lastTickTime = now;

    this.updatePlayers(deltaTime);
    this.updateDiscs(deltaTime, deltaMs);
    this.checkDiscToDiscCollisions();
    this.checkDiscToPlayerCollisions();
  }

  private updatePlayers(deltaTime: number): void {
    const wall = this.state.wallThickness;
    const halfWidth = 20; // player.width / 2
    const halfHeight = 30; // player.height / 2

    this.state.players.forEach((player) => {
      // Update position
      player.x += player.velocityX * deltaTime;
      player.y += player.velocityY * deltaTime;

      // Clamp to arena bounds (inside walls)
      const minX = wall + halfWidth;
      const maxX = this.state.arenaWidth - wall - halfWidth;
      const minY = wall + halfHeight;
      const maxY = this.state.arenaHeight - wall - halfHeight;

      player.x = Math.max(minX, Math.min(maxX, player.x));
      player.y = Math.max(minY, Math.min(maxY, player.y));
    });
  }

  private updateDiscs(deltaTime: number, deltaMs: number): void {
    const wall = this.state.wallThickness;

    this.state.discs.forEach((disc) => {
      // === HELD STATE ===
      if (disc.state === "held") {
        const owner = this.state.players.get(disc.ownerId);
        if (owner) {
          disc.x = owner.x;
          disc.y = owner.y;
        }
        return;
      }

      // === THREAT STATE ===
      if (disc.state === "threat") {
        // Countdown threat timer
        disc.threatTimeRemaining -= deltaMs;

        // Transition to inert when timer expires
        if (disc.threatTimeRemaining <= 0) {
          disc.state = "inert";
          disc.threatTimeRemaining = 0;
          console.log(`Disc ${disc.id} became inert`);
        }
      }

      // === UPDATE POSITION (threat and inert) ===
      disc.x += disc.velocityX * deltaTime;
      disc.y += disc.velocityY * deltaTime;

      // === WALL BOUNCE (threat only - inert passes through then returns) ===
      if (disc.state === "threat") {
        const minX = wall + disc.radius;
        const maxX = this.state.arenaWidth - wall - disc.radius;
        const minY = wall + disc.radius;
        const maxY = this.state.arenaHeight - wall - disc.radius;

        if (disc.x <= minX || disc.x >= maxX) {
          disc.velocityX *= -DISC_BOUNCE_DAMPING;
          disc.x = Math.max(minX, Math.min(maxX, disc.x));
        }
        if (disc.y <= minY || disc.y >= maxY) {
          disc.velocityY *= -DISC_BOUNCE_DAMPING;
          disc.y = Math.max(minY, Math.min(maxY, disc.y));
        }
      }

      // === INERT STATE - Return to owner ===
      if (disc.state === "inert") {
        const owner = this.state.players.get(disc.ownerId);
        if (owner) {
          const dx = owner.x - disc.x;
          const dy = owner.y - disc.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CATCH_DISTANCE) {
            // Disc caught
            disc.state = "held";
            disc.velocityX = 0;
            disc.velocityY = 0;
            disc.threatTimeRemaining = 0;
            owner.hasDisc = true;
            console.log(`Player ${owner.sessionId} caught their disc`);
          } else {
            // Home in on owner
            disc.velocityX = (dx / dist) * DISC_RETURN_SPEED;
            disc.velocityY = (dy / dist) * DISC_RETURN_SPEED;
          }
        }
      }
    });
  }

  // === DISC-TO-DISC COLLISION ===
  private checkDiscToDiscCollisions(): void {
    const discsArray = Array.from(this.state.discs.values());

    for (let i = 0; i < discsArray.length; i++) {
      for (let j = i + 1; j < discsArray.length; j++) {
        const discA = discsArray[i];
        const discB = discsArray[j];

        // Skip if either disc is held or inert
        if (discA.state !== "threat" || discB.state !== "threat") continue;

        // Check circle-to-circle collision
        const dx = discB.x - discA.x;
        const dy = discB.y - discA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = discA.radius + discB.radius;

        if (dist < minDist && dist > 0) {
          // Collision! Bounce both discs
          const nx = dx / dist; // Normal vector
          const ny = dy / dist;

          // Relative velocity
          const dvx = discA.velocityX - discB.velocityX;
          const dvy = discA.velocityY - discB.velocityY;

          // Relative velocity along normal
          const dvn = dvx * nx + dvy * ny;

          // Don't resolve if velocities are separating
          if (dvn > 0) continue;

          // Elastic collision (equal mass)
          discA.velocityX -= dvn * nx * DISC_BOUNCE_DAMPING;
          discA.velocityY -= dvn * ny * DISC_BOUNCE_DAMPING;
          discB.velocityX += dvn * nx * DISC_BOUNCE_DAMPING;
          discB.velocityY += dvn * ny * DISC_BOUNCE_DAMPING;

          // Separate discs to prevent overlap
          const overlap = minDist - dist;
          discA.x -= overlap * 0.5 * nx;
          discA.y -= overlap * 0.5 * ny;
          discB.x += overlap * 0.5 * nx;
          discB.y += overlap * 0.5 * ny;

          // Broadcast disc collision event
          this.broadcast("discCollision", {
            discA: discA.id,
            discB: discB.id,
            x: (discA.x + discB.x) / 2,
            y: (discA.y + discB.y) / 2
          });
        }
      }
    }
  }

  // === DISC-TO-PLAYER COLLISION ===
  private checkDiscToPlayerCollisions(): void {
    this.state.discs.forEach((disc) => {
      // Only threat discs can hit players
      if (disc.state !== "threat") return;

      this.state.players.forEach((player) => {
        // Don't hit the disc owner
        if (player.sessionId === disc.ownerId) return;

        // AABB vs circle collision
        const halfW = player.width / 2;
        const halfH = player.height / 2;
        const closestX = Math.max(player.x - halfW, Math.min(disc.x, player.x + halfW));
        const closestY = Math.max(player.y - halfH, Math.min(disc.y, player.y + halfH));

        const distX = disc.x - closestX;
        const distY = disc.y - closestY;
        const distSquared = distX * distX + distY * distY;

        if (distSquared < disc.radius * disc.radius) {
          // HIT! Award point to disc owner
          const owner = this.state.players.get(disc.ownerId);
          if (owner) {
            owner.score += 1;
            console.log(`Player ${disc.ownerId} scored! (${owner.score} points)`);
          }

          // Bounce disc off player (reflect velocity)
          const dist = Math.sqrt(distSquared) || 1;
          const nx = distX / dist;
          const ny = distY / dist;

          // Reflect: v' = v - 2(v·n)n
          const dot = disc.velocityX * nx + disc.velocityY * ny;
          disc.velocityX = (disc.velocityX - 2 * dot * nx) * DISC_BOUNCE_DAMPING;
          disc.velocityY = (disc.velocityY - 2 * dot * ny) * DISC_BOUNCE_DAMPING;

          // Push disc out of player
          disc.x = closestX + nx * (disc.radius + 1);
          disc.y = closestY + ny * (disc.radius + 1);

          // Extend threat time on hit
          disc.threatTimeRemaining = Math.min(
            disc.threatTimeRemaining + THREAT_EXTEND_ON_HIT,
            disc.threatTimeMax
          );

          // Broadcast hit event
          this.broadcast("playerHit", {
            hitPlayerId: player.sessionId,
            byPlayerId: disc.ownerId,
            discId: disc.id
          });
        }
      });
    });

    // === CATCH OWN DISC (threat mode) ===
    this.state.discs.forEach((disc) => {
      if (disc.state !== "threat") return;

      const owner = this.state.players.get(disc.ownerId);
      if (!owner) return;

      // Check grace period - can't catch immediately after throwing
      const throwTime = this.discThrowTimes.get(disc.id) ?? 0;
      if (Date.now() - throwTime < THROW_GRACE_PERIOD) {
        return; // Still in grace period, can't catch yet
      }

      // Check if owner can catch
      const dx = disc.x - owner.x;
      const dy = disc.y - owner.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CATCH_DISTANCE) {
        disc.state = "held";
        disc.velocityX = 0;
        disc.velocityY = 0;
        disc.threatTimeRemaining = 0;
        owner.hasDisc = true;
        this.discThrowTimes.delete(disc.id); // Clear throw time
        console.log(`Player ${owner.sessionId} caught their disc`);
      }
    });
  }
}
