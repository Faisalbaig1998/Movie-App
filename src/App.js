import React, { useState, useEffect } from "react";
// import socket from "./socket";
import "./css/App.css";
import Video from "./Video";
import { data } from "react-router-dom";

// Temporary for video.js
const App = () => {
  const [whois, setWhois] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [data, setData] = useState("");

  const handleChange = (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    if (file) {
      const tempfileURL = URL.createObjectURL(file);
      setFileURL(tempfileURL);
      formData.append("file", file);
      formData.append("name", file.name);
      console.log(formData);
    }

    fetch("http://192.168.29.88:8000/uploads", {
      method: "POST",
      body: formData,
    });
  };
  useEffect(() => {
    console.log(whois);
  }, [whois]);

  return (
    <>
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
            accept="video/*"
            onChange={(event) => {
              handleChange(event);
            }}
          />
          <Video path={fileURL} />
          <br />
          <button
            onClick={() => {
              setFileURL("");
            }}
          >
            Delete
          </button>
        </div>
      ) : (
        <Video />
      )}
      <button
        onClick={() => {
          fetch("http://192.168.29.88:8000")
            .then((res) => res.text()) // Extract text once
            .then((text) => {
              console.log("Response received from the server: ", text);
              setData(text); // Update state with the response
            })
            .catch((error) => console.error("Error:", error));
        }}
      >
        Check the server
      </button>
      <div>{data}</div>
    </>
  );
};

export default App;
