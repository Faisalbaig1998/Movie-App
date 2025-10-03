// server_modules/videoWorker.js
const { parentPort, workerData } = require("worker_threads");
const { exec } = require("child_process");
const path = require("path");
const {
  updateLanguages,
  extractAudioTracks,
  getMoviesJson,
  saveMoviesJson,
} = require("./uuid");
const { getContentType } = require("./utils");
const { extractAudio, findLanguages, extractSubs } = require("./extractor");

const videoProcessing = async (video) => {
  if (!video || !video.movie || !video.movie.localUrl) {
    parentPort.postMessage({ success: false, error: "Invalid video object" });
    return;
  }

  try {
    console.log("Worker is processing video: ", video.movie.filename);
    const codecData = await extractAudio(video.movie.localUrl);
    const languages = await findLanguages(codecData);
    await updateLanguages(video.uCode, languages);
    // await extractSubs(video);

    parentPort.postMessage({ success: true, languages, uCode: video.uCode });
  } catch (err) {
    console.error("Worker error:", err);
    parentPort.postMessage({
      success: false,
      error: err.message,
      uCode: video.uCode,
    });
  }
};

parentPort.on("message", (msg) => {
  console.log("Worker received message: ", msg);
  videoProcessing(msg.video);
});
