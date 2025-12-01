import { Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") sessionId: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") velocityX: number = 0;
  @type("number") velocityY: number = 0;
  @type("number") width: number = 40;
  @type("number") height: number = 60;
  @type("boolean") hasDisc: boolean = true;
  @type("number") score: number = 0;
}
