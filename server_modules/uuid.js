const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { get } = require("http");
const { extractSubs } = require("./extractor");
const {
  stripLastExtension,
  getMoviesJson,
  saveMoviesJson,
} = require("./utils.js");

const publicUrl = "http://192.168.29.88:8001/uploads/";
const uploadsDir = path.join(__dirname, "..", "uploads");

const checkFileExists = async (filepath, filename, uCode) => {
  const movies = await getMoviesJson();
  let movieId = uCode;

  if (!movies[uCode]) {
    movieId = uuidv4();
    const movieName = stripLastExtension(filename) || filename;

    movies[movieId] = {
      moviename: movieName,
      filename,
      url: publicUrl + filename,
      localUrl: path.join(uploadsDir, filename),
      time: new Date().toISOString(),
    };

    console.log(movieId, "is the new id");
    await saveMoviesJson(movies);
  }

  return {
    uCode: movieId,
    movie: movies[movieId],
  };
};

const updateLanguages = async (uCode, { languages, codecs }) => {
  let movies = await getMoviesJson();

  if (!movies[uCode]) {
    console.error("Movie not found for uCode:", uCode);
    return;
  }

  await extractAudioTracks(uCode, movies[uCode], codecs, languages);
};

const extractAudioTracks = async (uCode, movieData, codecs, languagesArr) => {
  const { moviename, localUrl } = movieData;
  let movies = await getMoviesJson();

  for (let i = 0; i < languagesArr.length; i++) {
    const lang = languagesArr[i];
    const codec = codecs[i];
    const langDir = path.join(uploadsDir, lang);

    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    const outputFilename = `${moviename}_${lang}.m4a`;
    const outputPath = path.join(langDir, outputFilename);
    const audioUrl = `${publicUrl + lang}/${outputFilename}`;

    if (!movies[uCode].languages) {
      movies[uCode].languages = {};
    }

    movies[uCode].languages[lang] = audioUrl;

    const command_opus = `ffmpeg -i "${localUrl}" -map 0:a:m:language:${lang} -c:a aac -b:a 128k "${outputPath}"`;
    const command_aac = `ffmpeg -i "${localUrl}" -map 0:a:m:language:${lang} -c copy "${outputPath}"`;

    const command = codec === "opus" ? command_opus : command_aac;

    console.log(`🎯 Running FFmpeg command for ${lang}: ${command}`);

    await runFFmpeg(command);
    console.log(`✅ Audio extracted for ${lang}`);
  }
  await saveMoviesJson(movies);
  movies = await extractSubs(movies[uCode], uCode);
  // if (movies[uCode].moviename.toLowerCase().endsWith(".mp4")) return;
  if (path.extname(movies[uCode].localUrl).toLowerCase() === ".mp4") return;

  console.log("Passing movies[moviename]: ", movies[uCode].moviename);

  const originalPath = movies[uCode].localUrl; // e.g., .mkv path
  const mp4Path = await convertToMp4(movies[uCode].localUrl);
  movies[uCode].localUrl = mp4Path;
  movies[uCode].filename = path.basename(mp4Path);
  movies[uCode].url = `${publicUrl}${movies[uCode].filename}`; // update URL

  await saveMoviesJson(movies);
  await deleteOtherFormats(uCode, originalPath, mp4Path);
};

const runFFmpeg = async (command) => {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ FFmpeg error:", stderr);
        return reject(error);
      }
      resolve();
    });
  });
};

/* const deleteOtherFormats = async (uCode, inputPath) => {
  const movieJson = await getMoviesJson();

  exec(`del "${inputPath}"`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error deleting original file:`, error.message);
      return;
    }
    console.log("✅ File deleted successfully");

    const outputPath = path.format({
      dir: path.dirname(inputPath),
      name: path.parse(inputPath).name,
      ext: ".mp4",
    });

    // Update both localUrl and url
    movieJson[uCode].localUrl = outputPath;

    const filenameMp4 = path.parse(inputPath).name + ".mp4";
    movieJson[uCode].url = `${publicUrl}${filenameMp4}`;

    console.log("Updating localUrl to:", outputPath);
    console.log("Updating url to:", movieJson[uCode].url);

    await saveMoviesJson(movieJson);
  });
}; */

const deleteOtherFormats = async (uCode, originalPath, mp4Path) => {
  const movieJson = await getMoviesJson();

  // Only delete the original file, not the mp4
  if (fs.existsSync(originalPath) && originalPath !== mp4Path) {
    fs.unlink(originalPath, (err) => {
      if (err) console.error("❌ Error deleting original file:", err.message);
      else console.log("✅ Original file deleted successfully");
    });
  }

  // Update JSON to point to mp4
  movieJson[uCode].localUrl = mp4Path;
  movieJson[uCode].filename = path.basename(mp4Path);
  movieJson[uCode].url = `${publicUrl}${path.basename(mp4Path)}`;

  console.log("Updating localUrl to:", mp4Path);
  console.log("Updating url to:", movieJson[uCode].url);

  await saveMoviesJson(movieJson);
};

const convertToMp4 = async (inputPath) => {
  return new Promise((resolve, reject) => {
    console.log("Converting to MP4:", inputPath);

    // Change only the extension to .mp4
    const outputPath = path.format({
      dir: path.dirname(inputPath),
      name: path.parse(inputPath).name,
      ext: ".mp4",
    });

    console.log("Output path:", outputPath);

    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

    console.log("Running command:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        // console.error("❌ Error converting to MP4:", error.message);
        console.error("❌ Error converting to MP4:", stderr);
        return reject(error);
      }
      console.log("✅ Conversion successful:", outputPath);
      resolve(outputPath);
    });
  });
};

module.exports = {
  checkFileExists,
  updateLanguages,
  extractAudioTracks,
};
