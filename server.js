const http = require("http");
const requestHandler = require("./server_modules/requestHandler");

const PORT = 8001;

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
