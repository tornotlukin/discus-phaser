import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { GameRoom } from "./rooms/GameRoom";

const PORT = Number(process.env.PORT) || 2567;

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

const httpServer = createServer(app);
const gameServer = new Server({ server: httpServer });

// Register room types
gameServer.define("game", GameRoom);

httpServer.listen(PORT, () => {
  console.log(`DISCUS Server listening on ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
