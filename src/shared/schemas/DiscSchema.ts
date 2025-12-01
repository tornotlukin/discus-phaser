import { Schema, type } from "@colyseus/schema";

export type DiscState = "held" | "threat" | "inert";

export class DiscSchema extends Schema {
  @type("string") id: string = "";
  @type("string") ownerId: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") velocityX: number = 0;
  @type("number") velocityY: number = 0;
  @type("number") radius: number = 12;
  @type("string") state: string = "held"; // "held" | "threat" | "inert"

  // Threat timer (synced to client for UI)
  @type("number") threatTimeRemaining: number = 0;  // ms remaining in threat mode
  @type("number") threatTimeMax: number = 30000;    // max threat duration (30 sec)
}
