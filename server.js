const http = require("http");
const requestHandler = require("./server_modules/requestHandler");
const { exec } = require("child_process");

const PORT = 8001;

// const command = `ffprobe -v error -select_streams a -show_entries stream=index,codec_name,channels,channel_layout,bit_rate:stream_tags=language -of json ${filename}`;

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
