// server_modules/wsHandler.js
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const { getMoviesJson } = require("./uuid");

let rooms = {};

async function initializeRooms() {
  const movieData = await getMoviesJson();
  rooms = Object.keys(movieData).reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
  console.log("Rooms initialized:", rooms);
}

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // initialize once
  initializeRooms();

  wss.on("connection", (ws) => {
    // assign unique id to each client
    ws.id = uuidv4();
    console.log("Client connected:", ws.id);

    ws.send(JSON.stringify({ message: "Welcome!", clientId: ws.id }));

    ws.on("message", (data) => {
      const json = JSON.parse(data.toString());
      const roomId = json.uCode;

      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }

      // check if client already exists in room
      const alreadyInRoom = rooms[roomId].some((client) => client.id === ws.id);
      if (!alreadyInRoom) {
        rooms[roomId].push({ id: ws.id, ws });
      }

      console.log(`Room ${roomId} has ${rooms[roomId].length} client(s).`);

      // Echo back to sender

      // Broadcast to others in the same room (optional)
      rooms[roomId].forEach((client) => {
        if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
          console.log("Sending this to the clients: ", {
            isPlaying: json.isPlaying,
            currentTime: json.currentTime,
          });
          client.ws.send(
            JSON.stringify({
              isPlaying: json.isPlaying,
              currentTime: json.currentTime,
            })
          );
        }
      });
    });

    ws.on("close", () => {
      console.log("Client disconnected:", ws.id);
      // remove from all rooms
      for (const [roomId, clients] of Object.entries(rooms)) {
        rooms[roomId] = clients.filter((client) => client.id !== ws.id);
        if (clients.length !== rooms[roomId].length) {
          console.log(
            `Client ${ws.id} removed. Room ${roomId} now has ${rooms[roomId].length} client(s).`
          );
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  console.log("✅ WebSocket server ready");
}

module.exports = setupWebSocket;
