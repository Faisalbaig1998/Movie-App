const http = require("http");
const requestHandler = require("./server_modules/requestHandler");
const { exec } = require("child_process");
const setupWebSocket = require("./server_modules/wsHandler");

const PORT = 8001;

const server = http.createServer(requestHandler);

// Setup WebSocket server
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
