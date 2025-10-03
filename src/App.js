import React, { useState, useEffect } from "react";
import "./css/App.css";
import Video from "./Video";
import Modal from "./modules/Modal";
import { checkFormat } from "./utils/reusable_func";

const App = () => {
  const [whois, setWhois] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [serverResponse, setServerResponse] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [movieData, setMovieData] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [serverChecking, setServerChecking] = useState(false);

  const handleData = (data) => {
    setMovieData(data.movie);
    setFileURL(data.movie.url);
    setUniqueCode(data.uCode);
    setWhois("host");
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file || !checkFormat(file.name)) {
      console.error("No file selected or Wrong file format");
      return;
    }

    const filePath = URL.createObjectURL(file);
    setFileURL(filePath);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://192.168.29.88:8001/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          console.log("File uploaded successfully:", data);
          setMovieData(data.movie.movie);
          setUniqueCode(data.movie.uCode);
          setFileURL(data.movie.movie.url);
        }
      })
      .catch((err) => {
        console.error("Error uploading file:", err);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const checkServer = () => {
    setServerChecking(true);
    fetch("http://192.168.29.88:8001")
      .then((response) => response.text())
      .then((text) => setServerResponse(text))
      .catch((error) => {
        console.error("Error:", error);
        setServerResponse("Server is down or not reachable");
      })
      .finally(() => {
        setServerChecking(false);
      });
  };

  useEffect(() => {
    console.log("Role:", whois);
    console.log("fileURL:", fileURL);
    console.log("movieData:", movieData);
  }, [whois, fileURL, movieData]);

  return (
    <>
      {whois === "watcher" && (
        <Modal onReceiveData={handleData} onClose={() => setWhois("")} />
      )}

      <div className="app-container">
        <div className="main-card">
          {/* Header */}
          <div className="app-header">
            <h1 className="app-title">🎬 Movie Sync App</h1>
            <p className="app-subtitle">
              Share and watch movies together in perfect sync
            </p>
          </div>

          {/* Content */}
          <div className="app-content">
            {/* Role Selection */}
            <div className="app-section">
              <h2 className="section-title">👥 Choose Your Role</h2>
              <div className="role-selector">
                <button
                  onClick={() => setWhois("host")}
                  className="role-button host-button"
                >
                  <span>📡</span>
                  I'm the Host
                </button>
                <button
                  onClick={() => setWhois("watcher")}
                  className="role-button watcher-button"
                >
                  <span>👀</span>
                  I'm the Watcher
                </button>
              </div>
            </div>

            {/* Host Section */}
            {whois === "host" && (
              <div className="app-section">
                <h2 className="section-title">🎥 Upload Your Movie</h2>
                <div className="upload-section">
                  {isUploading ? (
                    <div className="uploading-state">
                      <div className="spinner"></div>
                      <span>Uploading and processing movie...</span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        id="file-upload"
                        className="file-input"
                        onChange={handleChange}
                        accept=".mp4,.avi,.mov,.mkv,.webm"
                      />
                      <label htmlFor="file-upload" className="file-input-label">
                        📁 Click here to select a movie file
                        <small>
                          Supported formats: MP4, AVI, MOV, MKV, WEBM
                        </small>
                      </label>
                    </>
                  )}
                </div>

                {/* Video Player */}
                {fileURL && (
                  <div className="video-section">
                    <Video
                      path={fileURL}
                      audios={movieData.languages}
                      subs={movieData.subs}
                      uCode={uniqueCode}
                    />
                  </div>
                )}

                {/* Delete Button */}
                {fileURL && (
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(fileURL);
                      setFileURL("");
                      setMovieData({});
                      setUniqueCode("");
                    }}
                    className="action-button delete-button"
                  >
                    🗑️ Remove Movie
                  </button>
                )}
              </div>
            )}

            {/* Watcher Video Section */}
            {whois === "watcher" && fileURL && (
              <div className="app-section">
                <h2 className="section-title">🎬 Now Watching</h2>
                <div className="video-section">
                  <Video path={fileURL} audios={movieData.languages} />
                </div>
              </div>
            )}

            {/* Non-host/watcher state - show empty video player */}
            {!whois && <Video />}

            {/* Server Status */}
            <div className="app-section">
              <h2 className="section-title">🖥️ Server Status</h2>
              <button
                onClick={checkServer}
                disabled={serverChecking}
                className="action-button server-button"
              >
                {serverChecking ? (
                  <>
                    <div className="spinner spinner-small"></div>
                    Checking...
                  </>
                ) : (
                  <>🔍 Check Server</>
                )}
              </button>

              {serverResponse && (
                <div
                  className={`server-status ${
                    serverResponse.includes("down") ? "error" : "success"
                  }`}
                >
                  {serverResponse.includes("down") ? "❌" : "✅"}{" "}
                  {serverResponse}
                </div>
              )}
            </div>

            {/* Movie Info */}
            {(movieData.moviename || uniqueCode) && (
              <div className="info-card">
                <h3 className="info-title">📋 Movie Information</h3>
                {movieData.moviename && (
                  <div className="info-item">
                    <strong>Movie Name:</strong> {movieData.moviename}
                  </div>
                )}
                {uniqueCode && (
                  <div className="info-item">
                    <strong>Share Code:</strong>
                    <span className="info-code">{uniqueCode}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
