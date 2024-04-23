import { init, init as initOpenAI } from "./index.js";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import express from "express";
import bodyParser from "body-parser";

import cors from "cors";

import WebSocket, { WebSocketServer } from "ws";


async function engine(message) {
  message = message.toString("utf8");
  const res = await initOpenAI(message);
  return res;

}

function generateUniqueId() {
  const uniqueID = uuidv4();
  if (!isUniqueIdUsed(uniqueID)) {
      storeUniqueId(uniqueID);
      return uniqueID;
  } else {
      // If generated ID is not unique, recursively call the function again
      return generateUniqueId();
  }
}

// Check if the generated ID is already used
function isUniqueIdUsed(id) {
  const usedIds = getUsedIds();
  return usedIds.includes(id);
}

// Store the generated ID
function storeUniqueId(id) {
  fs.appendFileSync('usedIds.txt', id + '\n');
}

// Retrieve all previously used IDs
function getUsedIds() {
  try {
      const data = fs.readFileSync('usedIds.txt', 'utf8');
      return data.split('\n').filter(id => id.trim() !== '');
  } catch (err) {
      // If the file doesn't exist yet, return an empty array
      return [];
  }
}



const app = express();
app.use(cors());
app.use(bodyParser.json());

const httpServer = app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

const wss = new WebSocketServer({ server: httpServer });
const rooms = {};

wss.on("connection", socket => {
  let uuid = null; 

  const leave = room => {
    if (!rooms[room] || !rooms[room][uuid]) return;
    if (Object.keys(rooms[room]).length === 1) delete rooms[room];
    else delete rooms[room][uuid];
  };

  socket.on("message", (data) => {
    const receivedString = data.toString('utf-8');
    const jsonObject = JSON.parse(receivedString);
    console.log(jsonObject)
    const { message, meta, room } = jsonObject;

    if (meta === "join") {
      if (!room || typeof room !== 'string') {
        console.log("Invalid room name.");
        return;
      }

      uuid = generateUniqueId(); 
      if (!rooms[room]) {
        rooms[room] = {};
      }
      rooms[room][uuid] = socket;
      console.log(`Client joined room '${room}' with UUID '${uuid}'.`);
    } else if (meta === "leave") {
      leave(room);
      console.log(`Client left room '${room}' with UUID '${uuid}'.`);
    } else if (!meta) {
      console.log('this is calle')
      if (!rooms[room]) {
        console.log(`Room '${room}' does not exist.`);
        return;
      }
      Object.values(rooms[room]).forEach((clientSocket) => {
        clientSocket.send(JSON.stringify(message));
      });

      const res = engine(message);
      res.then((dat) => {
        const timestamp = Date.now();
        const responseObj = {
          dat: dat,
          meta: "chatMessage",
          room: room,
          sender: uuid,
          timestamp: timestamp
        };
       
        Object.values(rooms[room]).forEach((clientSocket) => {
          clientSocket.send(JSON.stringify(responseObj));
        });
        console.log(`Response sent to room '${room}'.`);
      }).catch((err) => {
        console.error("Error processing message:", err);
      });
    }
  });

  socket.on("close", () => {
    Object.keys(rooms).forEach(room => leave(room));
    console.log(`Connection closed for UUID '${uuid}'.`);
  });
});
