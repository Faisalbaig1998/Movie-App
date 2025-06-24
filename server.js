const http = require("http");
const fs = require("fs");
const path = require("path");
const Busboy = require("busboy");
const checkFileExists = require("./server_modules/uuid.js");

const PORT = 8001;

const server = http.createServer((req, res) => {
  let video = {};
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("\n[Server Info]");
  console.log("Directory:", __dirname);
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);
  console.log("Time:", new Date().toISOString());

  if (req.method === "POST" && req.url === "/upload") {
    const busboy = Busboy({ headers: req.headers });
    console.log("Busboy initialized for file upload");

    let fileUploadPromise = null;

    busboy.on("file", (fieldname, file, { filename }) => {
      const savePath = path.join(__dirname, "uploads", filename);
      console.log(`Receiving file [${fieldname}]: ${filename}`);

      const writeStream = fs.createWriteStream(savePath);
      file.pipe(writeStream);

      // Wait for the file to finish writing, then call checkFileExists
      fileUploadPromise = new Promise((resolve, reject) => {
        writeStream.on("finish", async () => {
          console.log(`File is accessible at: ${savePath}`);
          try {
            video = await checkFileExists(savePath, filename, fieldname);
            console.log(`File code (video): ${video}`);
            resolve();
          } catch (err) {
            console.error("Error checking file:", err);
            reject(err);
          }
        });
      });
    });

    busboy.on("finish", async () => {
      console.log("Upload complete");

      if (fileUploadPromise) {
        try {
          await fileUploadPromise;
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Failed to process upload" }));
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Upload successful", movie: video })
      );
    });

    req.pipe(busboy);
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is running");
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
