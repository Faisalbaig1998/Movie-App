const path = require("path");
const fs = require("fs");
const moviesJsonPath = path.join(__dirname, "..", "movies.json");

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mkv":
      return "video/x-matroska";
    case ".m4a":
      return "audio/mp4";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".txt":
      return "text/plain";
    case ".json":
      return "application/json";
    case ".vtt": // ✅ Add this
      return "text/vtt";
    default:
      return "application/octet-stream";
  }
}

const getMoviesJson = async () => {
  try {
    const data = await fs.promises.readFile(moviesJsonPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading movies.json:", err);
    return {};
  }
};

const saveMoviesJson = async (data) => {
  try {
    await fs.promises.writeFile(
      moviesJsonPath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
    console.log("movies.json updated successfully");
  } catch (err) {
    console.error("Error saving movies.json:", err);
  }
};

function stripLastExtension(filename) {
  // console.log("Stripping last extension from filename:", filename);
  // Use regex to remove the last extension
  return filename.replace(/\.[^/.]+$/, "");
}

module.exports = {
  getContentType,
  stripLastExtension,
  getMoviesJson,
  saveMoviesJson,
};
