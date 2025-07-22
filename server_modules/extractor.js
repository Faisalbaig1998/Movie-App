const { exec } = require("child_process");

function extractAudio(path) {
  console.log("We are in extractAudio function");
  console.log(`Extracting audio from: ${path}`);

  const command = `ffprobe -v error -select_streams a -show_entries stream=index,codec_name,channels,channel_layout,bit_rate:stream_tags=language -of json "${path}"`;

  // ✅ Return a Promise so it can be awaited
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("ffprobe error:", err);
        return reject(err);
      }

      if (stderr) {
        console.warn("ffprobe stderr:", stderr); // Not fatal, just a warning
      }

      try {
        const jsonData = JSON.parse(stdout);
        console.log("We are in extractor function:", jsonData);
        resolve(jsonData); // ✅ Resolve the Promise with parsed data
      } catch (parseErr) {
        console.log("Error parsing ffprobe output:", parseErr);
        reject(parseErr); // ❌ Reject if JSON is invalid
      }
    });
  });
}

module.exports = { extractAudio };
