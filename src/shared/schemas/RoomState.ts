import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";
import { DiscSchema } from "./DiscSchema";

export class RoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: DiscSchema }) discs = new MapSchema<DiscSchema>();

  @type("number") arenaWidth: number = 800;
  @type("number") arenaHeight: number = 600;
  @type("number") wallThickness: number = 10;
}
