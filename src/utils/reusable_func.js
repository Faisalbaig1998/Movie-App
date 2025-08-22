const videoFormats = [
  ".mp4",
  ".mkv",
  ".webm",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".m4v",
  ".ogv",
  ".ts",
  ".m3u8",
  ".mpd",
];

export function checkFormat(filename) {
  // filename = filename.toLowerCase();
  // console.log("Checking format for: ", filename);
  for (const format of videoFormats) {
    // console.log("checking format: ", format);

    if (filename.toLowerCase().endsWith(format)) {
      // console.log("Format matched: ", format);
      return true;
    }
  }
  return false;
}

/* export function toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
} */
