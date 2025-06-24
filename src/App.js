import React, { useState, useEffect } from "react";
// import socket from "./socket";
import "./css/App.css";
import Video from "./Video";
import Modal from "./modules/Modal";
import { checkFormat } from "./utils/reusable_func";
// import { data } from "react-router-dom";

// Temporary for video.js
const App = () => {
  const [whois, setWhois] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [data, setData] = useState("");
  const [serverResponse, setServerResponse] = useState("");

  const handleChange = (e) => {
    // console.log("Handlechange is working fine");
    const file = e.target.files[0];
    // console.log("File selected:", file);
    let isVideo = checkFormat(file.name);
    // console.log("Is video format:", isVideo);
    if (!file || !isVideo) {
      console.error("No file selected or Wrong file format");
      return;
    }
    const filePath = URL.createObjectURL(file);
    setFileURL(filePath);

    const formData = new FormData();
    console.log("FormData is working fine: ", formData);
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
        console.log("Second then is working fine");
        console.log("Here is the data: ", data);
        if (data) {
          console.log(data.message);
          console.log(data.movie);
          // setFileURL(data.movie.url);
        }
      })
      .catch((err) => {
        console.error("Error uploading file:", err);
      });
  };

  useEffect(() => {
    console.log(whois);
    console.log("fileURL: ", fileURL);
  }, [whois]);

  return (
    <>
      {/* {whois == "watcher" ? <Modal /> : null} */}
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
      </div>
    </>
  );
};

export default App;
