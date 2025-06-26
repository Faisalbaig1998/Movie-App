const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const checkFileExists = require("./uuid");
const { getContentType } = require("./utils");

module.exports = async function requestHandler(req, res) {
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
      const savePath = path.join(__dirname, "..", "uploads", filename);
      console.log(`Receiving file [${fieldname}]: ${filename}`);

      const writeStream = fs.createWriteStream(savePath);
      file.pipe(writeStream);

      fileUploadPromise = new Promise((resolve, reject) => {
        writeStream.on("finish", async () => {
          console.log(`File is accessible at: ${savePath}`);
          try {
            video = await checkFileExists(savePath, filename, uniqueCode);
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
      res.end(JSON.stringify({ message: "Upload successful", movie: video }));
    });

    req.pipe(busboy);
  } else if (req.method === "GET" && req.url.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, "..", decodeURIComponent(req.url));
    const uploadsDir = path.join(__dirname, "..", "uploads");

    if (!filePath.startsWith(uploadsDir)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      return res.end("Access denied");
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("File not found");
      }

      const readStream = fs.createReadStream(filePath);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(200, { "Content-Type": getContentType(filePath) });
      readStream.pipe(res);
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is running");
  }
};
