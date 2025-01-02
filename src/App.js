import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./css/App.css";
import Video from "./Video";

const socket = io("http://192.168.29.88:8000");

const App = () => {
  const [whois, setWhois] = useState("");
  const [videoElement, setVideoElement] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log(
        "Connected to server and we are emitting tellMetheTime event"
      );

      // socket.emit("tellMetheTime");
    });
  }, [videoElement]);
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
        {/* {areYouWatching ? <Video path="../resources/DB11" /> : ""} */}
        {/* {whois == "host" ? <Video path="../resources/DB11" /> : ""} */}
        {/* <Video
          path="../resources/DB11"
          ref={(element) => {
            setVideoElement(element);
          }}
        /> */}
        {whois == "watcher" ? <Video path="../resources/DB11" /> : ""}
      </div>
    </>
  );
};

export default App;
