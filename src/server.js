const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
  res.end("I am connected");
});

let videoCurrentTime = 0;
let videoIsPlaying = false;

const io = new Server(server, {
  cors: {
    // origin: "http://192.168.29.88:3000", // Allow React app
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

io.on("connection", (client) => {
  console.log("Client connected: ", client.id);
  // io.emit("tellMetheTime");

  client.on("onPlay", (data) => {
    console.log(data);
    console.log("We are emitting this data to the client: ", data);
    videoCurrentTime = data.time;
    console.log("Value of videoCurrentTime: ", videoCurrentTime);
    videoIsPlaying = data.isPlaying;
    console.log("Value of videoIsPlaying: ", videoIsPlaying);
    io.emit("time", data);
  });

  client.on("tellMetheTime", () => {
    console.log(
      "We are emitting the time to the client: ",
      videoCurrentTime,
      videoIsPlaying
    );
    io.emit("setTime", { time: videoCurrentTime, isPlaying: videoIsPlaying });
    // io.emit("setTime", videoCurrentTime);
  });

  client.on("disconnect", () => {
    console.log("Client disconnected: ", client.id);
  });
});

server.listen(8000, () => {
  console.log("Server is running on port 8000");
});
