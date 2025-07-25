const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { time } = require("console");

const filePath = "http://192.168.29.88:8001/uploads/";
const localFilePath = path.join(__dirname, "..", "uploads");
const checkFileExists = async (filepath, filename, uCode) => {
  console.log("checkFileExists called with:", filepath, filename, uCode);
  const moviesPath = path.join(__dirname, "..", "movies.json");
  let id = "";
  let movies = {};

  try {
    const data = await fs.promises.readFile(moviesPath, "utf-8");
    movies = JSON.parse(data);
    // console.log("We are in uuid and we have the unique code: ", uCode);
    // console.log("Here is the movie object", movies[uCode]);

    if (!movies[uCode]) {
      console.log("No movie found for the given uCode, creating new entry.");
      console.log("Movie found: ", movies[uCode]);
      id = uuidv4();
      movies[id] = {
        moviename: filename == null ? "" : filename,
        filename: filename,
        url: filePath + filename,
        localUrl: path.join(localFilePath, filename),
        time: new Date().toISOString(),
      };
      await fs.promises.writeFile(
        moviesPath,
        JSON.stringify(movies, null, 2),
        "utf-8"
      );
      console.log(id, "is the new id");
      console.log("No movie found for the given uCode, creating new entry.");
      console.log("movies.json updated successfully.");
    } else {
      console.log("Movie found for the given uCode: ", uCode);
      console.log("Movies data:", movies[uCode]);
    }
  } catch (err) {
    console.error("Error handling movies.json:", err);
  }
  /*  console.log("id in uuid before returning: ", id);
  console.log(
    `movies[${uCode ? uCode : id}]: `,
    movies[uCode] ? movies[uCode] : movies[id]
  ); */
  return {
    uCode: movies[uCode] ? uCode : id,
    movie: movies[uCode] ? movies[uCode] : movies[id],
  };
};

module.exports = checkFileExists;

// checkFileExists("../uploads/" + id, "example.mp4", "xxyyzz");

/* checkFileExists(
  "C:\\Practice\\React Practice\\movie-app\\uploads\\Venice_5.mp4",
  "Venice_5.mp4",
  "53676105-bb9c-4aa3-9f79-702b9f4d9af0"
); */

/* checkFileExists(
  "C:\\Practice\\React Practice\\movie-app\\uploads\\Venice_5.mp4",
  "Venice_5.mp4"
); */
// const addExtraslashes = (path) => {
//   return path.replace(/\\/g, "\\\\");
// };
