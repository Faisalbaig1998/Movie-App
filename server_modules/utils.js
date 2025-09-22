const path = require("path");

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mkv": // ✅ added MKV support
      return "video/x-matroska";
    case ".m4a":
      return "audio/mp4"; // or "audio/x-m4a"
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
    default:
      return "application/octet-stream";
  }
}

function stripLastExtension(filename) {
  // console.log("Stripping last extension from filename:", filename);
  // Use regex to remove the last extension
  return filename.replace(/\.[^/.]+$/, "");
}

module.exports = { getContentType, stripLastExtension };
