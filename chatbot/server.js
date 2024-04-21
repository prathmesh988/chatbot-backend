import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import WebSocket, { WebSocketServer } from "ws";
import { init, init as initOpenAI } from "./index.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const httpServer = app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    message = message.toString("utf8");
    const res = await initOpenAI(message);
    ws.send(res);
  });
  ws.send("Hello! Message received!");
});
