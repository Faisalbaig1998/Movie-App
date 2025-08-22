const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const { checkFileExists, updateLanguages } = require("./uuid");
const { getContentType } = require("./utils");
const { extractAudio, findLanguages } = require("./extractor");

/**
 * Serve a file with HTTP Range support for seeking
 */
function serveFileWithRange(filePath, req, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("File not found");
    }

    const range = req.headers.range;
    const fileSize = stats.size;
    const contentType = getContentType(filePath);

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          "Content-Range": `bytes */${fileSize}`,
          "Content-Type": contentType,
        });
        return res.end();
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

/**
 * Handle file upload via POST /upload
 */
function handleUpload(req, res) {
  const busboy = Busboy({ headers: req.headers });
  let video = {};
  let uploadPromise;

  busboy.on("file", (fieldname, file, { filename }) => {
    const savePath = path.join(__dirname, "..", "uploads", filename);
    const writeStream = fs.createWriteStream(savePath);
    file.pipe(writeStream);

    uploadPromise = new Promise((resolve, reject) => {
      writeStream.on("finish", async () => {
        try {
          video = await checkFileExists(savePath, filename);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });

  busboy.on("finish", async () => {
    if (uploadPromise) {
      try {
        await uploadPromise;
        const codecData = await extractAudio(video.movie.localUrl);
        const languages = await findLanguages(codecData);
        await updateLanguages(video.uCode, languages);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Upload successful",
            movie: video,
            languages,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to process upload" }));
      }
    }
  });

  req.pipe(busboy);
}

/**
 * Retrieve video info via POST /code
 */
function handleCode(req, res) {
  const busboy = Busboy({ headers: req.headers });
  let videoPromise;

  busboy.on("field", (fieldname, value) => {
    if (fieldname === "uniqueCode") {
      videoPromise = checkFileExists("", "", value);
    }
  });

  busboy.on("finish", async () => {
    const videoData = videoPromise ? await videoPromise : null;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Retrieved video", movie: videoData }));
  });

  req.pipe(busboy);
}

/**
 * Print server info
 */
function printServerInfo(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("\n[Server Info]");
  console.log("Directory:", __dirname);
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);
  console.log("Time:", new Date().toISOString(), "\n");
}

/**
 * Main request handler
 */
module.exports = async function requestHandler(req, res) {
  printServerInfo(req, res);

  if (req.method === "POST" && req.url === "/upload") {
    handleUpload(req, res);
  } else if (req.method === "GET" && req.url.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, "..", decodeURIComponent(req.url));
    const uploadsDir = path.join(__dirname, "..", "uploads");

    if (!filePath.startsWith(uploadsDir)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      return res.end("Access denied");
    }

    serveFileWithRange(filePath, req, res);
  } else if (req.method === "POST" && req.url === "/code") {
    handleCode(req, res);
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is running");
  }
};
