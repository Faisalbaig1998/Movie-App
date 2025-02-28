const fs = require("fs");
const http = require("http");
const multer = require("multer");

const server = http.createServer((req, res) => {
  console.log(req)
  if (req.method === "POST") {
    fs.di
    let body = "";
    req.on("data", (chunk) => {
      // console.log("Chunk received: ", chunk);
      body += chunk.toString();
      // console.log("Body: ", body);
    });
    req.on("end", () => {
      fs.writeFileSync("file.mp4", body, "binary");
      res.end("File uploaded successfully");
    });
  }
  console.log("Request made");
  res.writeHead(200, {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "*",
  }); // Set the response header
  res.end("Hello World"); // Send the response
});

server.listen(8000, () => {
  console.log("Server is running on port 8000");
}); // Listen on port 8000
