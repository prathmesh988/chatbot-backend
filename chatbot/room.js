const WebSocket = require("ws");

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Define a map to store connections by room
const rooms = new Map();

// WebSocket server event listener
wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    // Parse the message to JSON
    const data = JSON.parse(message);

    // Check if the message is for joining a room
    if (data.type === "joinRoom") {
      const roomName = data.room;

      // Create the room if it doesn't exist
      if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
      }

      // Add the connection to the room
      rooms.get(roomName).add(ws);

      console.log(`User joined room ${roomName}`);
    } else if (data.type === "message") {
      // Broadcast the message to all connections in the same room
      const roomName = data.room;
      const message = data.message;

      if (rooms.has(roomName)) {
        rooms.get(roomName).forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "message", message }));
          }
        });
      }
    }
  });
});
