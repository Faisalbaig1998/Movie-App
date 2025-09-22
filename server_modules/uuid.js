const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { stripLastExtension } = require("./utils");
const { get } = require("http");

const publicUrl = "http://192.168.29.88:8001/uploads/";
const uploadsDir = path.join(__dirname, "..", "uploads");
const moviesJsonPath = path.join(__dirname, "..", "movies.json");

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
  const movies = await getMoviesJson();

  if (!movies[uCode]) {
    console.error("Movie not found for uCode:", uCode);
    return;
  }

  await extractAudioTracks(uCode, movies[uCode], codecs, languages);
};

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

const extractAudioTracks = async (uCode, movieData, codecs, languagesArr) => {
  const { moviename, localUrl } = movieData;
  const movies = await getMoviesJson();

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

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error extracting audio for ${lang}:`, error.message);
        return;
      }

      if (stderr) {
        // console.warn(`⚠️ FFmpeg stderr for ${lang}:`, stderr);
      }

      console.log(`✅ Audio extracted for ${lang}`);
    });
  }
  await saveMoviesJson(movies);
  if (movies[uCode].moviename.toLowerCase().endsWith(".mp4")) return;
  console.log("Passing movies[moviename]: ", movies[uCode].moviename);
  await convertToMp4(movies[uCode].localUrl);
  await deleteOtherFormats(uCode, movies[uCode].localUrl);
};

const deleteOtherFormats = async (uCode, inputPath) => {
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
};

const convertToMp4 = (inputPath) => {
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
        console.error("❌ Error converting to MP4:", error.message);
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
  getMoviesJson,
  saveMoviesJson,
};
