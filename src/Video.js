import React, { useEffect, forwardRef, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://192.168.29.88:8000");

const Video = forwardRef((props, ref) => {
  const localRef = useRef(null);

  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") {
        ref(localRef.current);
      } else {
        ref.current = localRef.current;
      }
    }

    socket.on("time", (data) => {
      localRef.current.currentTime = data.time;
    });

    socket.on("setTime", (data) => {
      // console.log("We are in the setTime event");
      console.log("Setting the time to: ", data.time);
      localRef.current.currentTime = data.time;
      // if (!data.isPlaying) {
      //   localRef.current.play();
      // } else {
      //   localRef.current.pause();
      // }
    });

    // socket.on("setTime", (data) => {
    //   console.log("Setting the time to: ", data.time);
    //   localRef.current.currentTime = data.time;
    // });
    return () => {
      socket.off("time");
    };
  }, []);

  const handlePlay = (play) => {
    socket.emit("onPlay", { isPlaying: play.isPlaying, time: play.time });
  };

  return (
    <video
      width="320"
      height="200"
      ref={localRef}
      controls
      onPlay={() => {
        handlePlay({ isPlaying: true, time: localRef.current.currentTime });
      }}
      onPause={() => {
        handlePlay({ isPlaying: false, time: localRef.current.currentTime });
      }}
    >
      <source src={`${props.path}.mp4`} type="video/mp4" />
      <source src={`${props.path}.ogg`} type="video/ogg" />
      Your browser does not support the video tag.
    </video>
  );
});

export default Video;
