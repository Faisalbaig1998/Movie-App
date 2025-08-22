const { exec } = require("child_process");

/**
 * Extract audio stream metadata from a video file using ffprobe.
 * @param {string} filePath - The path to the video file.
 * @returns {Promise<Object>} - Parsed JSON containing audio stream metadata.
 */
function extractAudio(filePath) {
  console.log("▶️ Running extractAudio for:", filePath);

  const command = `ffprobe -v error -select_streams a -show_entries stream=index,codec_name,channels,channel_layout,bit_rate:stream_tags=language -of json "${filePath}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ ffprobe execution error:", error.message);
        return reject(error);
      }

      if (stderr) {
        console.warn("⚠️ ffprobe stderr:", stderr);
      }

      try {
        const metadata = JSON.parse(stdout);
        console.log("✅ ffprobe output parsed successfully");
        resolve(metadata);
      } catch (parseError) {
        console.error("❌ Failed to parse ffprobe output:", parseError.message);
        reject(parseError);
      }
    });
  });
}

/**
 * Extracts language codes from ffprobe metadata.
 * @param {Object} metadata - The metadata object returned from ffprobe.
 * @returns {{ count: number, languages: string[] }}
 */
const findLanguages = (metadata) => {
  console.log("🔍 Analyzing audio streams...");

  const streams = metadata.streams || [];
  const languages = streams.map((stream) => stream?.tags?.language || "und");
  const codecs = streams.map((stream) => stream.codec_name || "unknown");
  console.log(`✅ Found ${languages.length} audio stream(s):`, languages);
  console.log(`🔍 Audio codecs used:`, codecs);
  return {
    count: languages.length,
    languages,
    codecs,
  };
};

module.exports = {
  extractAudio,
  findLanguages,
};
