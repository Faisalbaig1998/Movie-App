const { exec } = require("child_process");
const path = require("path");
const { getMoviesJson, saveMoviesJson } = require("./utils.js");
const fs = require("fs");

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

function findSubs(video) {
  console.log("▶️ Running findSubs for:", video.localUrl); //main;

  // console.log("▶️ Running findSubs for:", video); //temp

  const command = `ffprobe -v error -select_streams s -show_entries stream=index,codec_name:stream_tags=language -of json "${video.localUrl}"`; //main
  // const command = `ffprobe -v error -select_streams s -show_entries stream=index,codec_name:stream_tags=language -of json "${video}"`; //temp

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

        // Map to clean array
        const subtitles = (metadata.streams || []).map((s) => ({
          index: s.index,
          codec: s.codec_name,
          lang: s.tags?.language || "und", // "und" = undefined
        }));

        console.log("✅ Clean subtitles array:", subtitles);
        resolve(subtitles);
      } catch (parseError) {
        console.error("❌ Failed to parse ffprobe output:", parseError.message);
        reject(parseError);
      }
    });
  });
}

async function extractSubs(video, uCode) {
  console.log("extractSubs Running with video: ", video);
  const movies = await getMoviesJson();
  const subs = await findSubs(video);
  const localPath = "C:\\Practice\\React Practice\\movie-app\\uploads";
  const publicUrl = "http://192.168.29.88:8001/uploads/";
  const subArr = [];
  for (const sub of subs) {
    console.log("sub: ", sub.index);

    // Make the output path cross-platform safe and handle spaces
    const outputPath = path.join(
      localPath,
      sub.lang,
      `${video.moviename}_${sub.index}.ass`
    );
    subArr.push(outputPath);
    const subURL = `${publicUrl}${sub.lang}/${video.moviename}_${sub.index}.vtt`;

    const command = `ffmpeg -i "${video.localUrl}" -map 0:${sub.index} "${outputPath}"`;
    // movies[uCode];
    await runffmpegforSubs(command);
    if (!movies[uCode].subs) {
      movies[uCode].subs = {};
    }

    movies[uCode].subs[`${sub.lang}_${sub.index}`] = subURL;
    await convertToSrt(subArr.shift());
  }
  await saveMoviesJson(movies);
  console.log("subArr: ", subArr);

  console.log("subs: ", subs);
  return movies;
}

const convertToSrt = (filePath) => {
  return new Promise((resolve, reject) => {
    console.log("convertToSrt is running with path: ", filePath);
    const parsed = path.parse(filePath);
    const outputPath = path.join(parsed.dir, parsed.name + ".vtt");
    const command = `ffmpeg -i "${filePath}" "${outputPath}"`;
    console.log("command in convertToSrt: ", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Error converting:", error.message);
        reject(error);
        return;
      }
      console.log(`✅ Converted to: ${outputPath}`);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("❌ Error deleting original file:", err.message);
          reject(err);
          return;
        }
        console.log(`🗑️ Deleted original: ${filePath}`);
        resolve(outputPath);
      });
    });
  });
};

const runffmpegforSubs = async (command) => {
  return new Promise((resolve, reject) => {
    console.log("runffmpegforSubs is running with command:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ ffmpeg execution error:", error.message);
        return reject(error);
      }

      if (stderr) {
        console.warn("⚠️ ffmpeg stderr:", stderr);
      }

      console.log("✅ Subtitle extraction finished successfully");
      resolve(true); // resolve when done
    });
  });
};

module.exports = {
  extractAudio,
  findLanguages,
  findSubs,
  extractSubs,
};

const testPath = "C:\\Users\\mirza\\Downloads\\videos\\Kaiju_number_8.mkv";
const movieData = {
  movie: {
    moviename: "IMG_3822",
    filename: "IMG_3822.mp4",
    url: "http://192.168.29.88:8001/uploads/IMG_3822.mp4",
    localUrl: "C:\\Practice\\React Practice\\movie-app\\uploads\\IMG_3822.mp4",
    time: "2025-09-27T09:18:01.709Z",
    languages: {
      eng: "http://192.168.29.88:8001/uploads/eng/IMG_3822_eng.m4a",
    },
  },
};

async function main() {
  // const testvar = await extractAudio(testPath);
  // console.log(testvar);
  extractSubs(testPath);
}

// main();
