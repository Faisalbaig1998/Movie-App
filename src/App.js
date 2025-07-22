import React, { useState, useEffect } from "react";
// import socket from "./socket";
import "./css/App.css";
import Video from "./Video";
import Modal from "./modules/Modal";
import { checkFormat } from "./utils/reusable_func";

// Temporary for video.js
const App = () => {
  const [whois, setWhois] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [serverResponse, setServerResponse] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [movieData, setMovieData] = useState({});

  const handleData = (data) => {
    console.log("Received data from Modal: ", data);
    setMovieData(data);
    setFileURL(data.url);
    setWhois("host");
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    let isVideo = checkFormat(file.name);
    if (!file || !isVideo) {
      console.error("No file selected or Wrong file format");
      return;
    }
    const filePath = URL.createObjectURL(file);
    setFileURL(filePath);

    const formData = new FormData();
    // console.log("FormData is working fine: ", formData);
    formData.append("file", file);

    fetch("http://192.168.29.88:8001/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        console.log(res);
        console.log("First then is working fine");
        return res.json();
      })
      .then((data) => {
        // console.log("Second then is working fine");
        // console.log("Here is the data: ", data);
        if (data) {
          setMovieData(data.movie.movie);
          setUniqueCode(data.movie.uCode);
          console.log("Here is the movieData: ", data);
          setFileURL(movieData.url);
          console.log("Here is movieData: ", movieData);
        }
      })
      .catch((err) => {
        console.error("Error uploading file:", err);
      });
  };

  useEffect(() => {
    console.log(whois);
    console.log("fileURL: ", fileURL);
    console.log("movieData ", movieData);
  }, [whois, fileURL, movieData]);

  return (
    <>
      {whois == "watcher" ? <Modal onReceiveData={handleData} /> : null}
      <h1 className="title">Movie App</h1>
      <div>
        <h2>Movie Title</h2>
        <p>Movie Description</p>
        <div className="buttons">
          <span
            onClick={() => {
              setWhois("host");
            }}
          >
            I'm the Host
          </span>
          <span
            onClick={() => {
              setWhois("watcher");
            }}
          >
            I'm the Watcher
          </span>
        </div>
      </div>
      {whois == "host" ? (
        <div>
          <input
            type="file"
            onChange={(event) => {
              handleChange(event);
            }}
          />
          <Video path={fileURL} />
          <br />
          <button
            onClick={() => {
              setFileURL("");
              URL.revokeObjectURL(fileURL);
            }}
          >
            Delete
          </button>
        </div>
      ) : (
        <Video />
      )}
      <br />
      <button
        onClick={() => {
          console.log("Checking server...");
          fetch("http://192.168.29.88:8001")
            .then((response) => response.text())
            .then((text) => setServerResponse(text))
            .catch((error) => {
              console.error("Error:", error);
              setServerResponse("Server is down or not reachable");
            });
        }}
      >
        Check the server
      </button>
      <br />
      <div>
        {serverResponse
          ? serverResponse
          : "No response from server or server is down"}
        <div>
          <h1>Movie info</h1>

          <h3>Movie Name: {JSON.stringify(movieData.moviename)}</h3>
          <h3>Here is the unique code: {uniqueCode}</h3>
        </div>
      </div>
    </>
  );
};

export default App;
