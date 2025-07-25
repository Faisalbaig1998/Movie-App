const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const checkFileExists = require("./uuid");
const { getContentType } = require("./utils");
const { extractAudio } = require("./extractor");

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
            video = await checkFileExists(savePath, filename);
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
      console.log("Upload finished");

      if (fileUploadPromise) {
        try {
          await fileUploadPromise;
          console.log("File upload and check completed successfully ");
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Failed to process upload" }));
        }
      }

      console.log("Video data: ", video);
      let codecData = await extractAudio(video.movie.localUrl);
      // console.log("About to get codec data");
      console.log("Codec data:", codecData);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Upload successful",
          movie: video,
          codecData,
        })
      );
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
  } else if (req.method === "POST" && req.url === "/code") {
    const busboy = Busboy({ headers: req.headers });

    console.log("Busboy initialized for code retrieval");

    let videoPromise;

    busboy.on("field", (fieldname, value) => {
      if (fieldname === "uniqueCode") {
        console.log("uniqueCode received:", value);
        // Create a promise and save it
        videoPromise = checkFileExists("", "", value).then((videoData) => {
          // console.log("Video data retrieved:", videoData);
          return videoData;
        });
      }
    });

    busboy.on("finish", async () => {
      console.log("Code retrieval complete");

      let videoData = null;
      if (videoPromise) {
        videoData = await videoPromise;
      }

      console.log("Video data:", videoData);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Retrieved video", movie: videoData }));
    });

    req.pipe(busboy);
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is running");
  }
};
