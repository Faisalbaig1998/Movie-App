import { useEffect, useRef, useState } from "react";
import "./css/Video.css";

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Separate component for audio buttons to handle hover state
const AudioButton = ({ audioKey, audioValue, isActive, onClick }) => {
  const [buttonHovered, setButtonHovered] = useState(false);

  return (
    <div>
      <audio
        id={audioKey + "-audio"}
        src={audioValue}
        preload="auto"
        className="hidden"
        onPlay={() => console.log(`${audioKey} audio playing`)}
      />
      <button
        onClick={onClick}
        className={`audio-button ${isActive ? "active" : "inactive"} ${
          buttonHovered ? "hovered" : ""
        }`}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
      >
        {toTitleCase(audioKey)}
      </button>
    </div>
  );
};

const Video = (props) => {
  const videoRef = useRef(null);

  // UI State
  const [videoHovered, setVideoHovered] = useState(false);
  const [playButtonHovered, setPlayButtonHovered] = useState(false);
  const [fullscreenButtonHovered, setFullscreenButtonHovered] = useState(false);
  const [currentAudio, setCurrentAudio] = useState("");
  const currentAudioRef = useRef(currentAudio);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [ws, setWs] = useState(null);
  const isRemoteAction = useRef(false);

  const fullscreen = () => {
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.mozRequestFullScreen) {
      /* Firefox */
      videoRef.current.mozRequestFullScreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      videoRef.current.webkitRequestFullscreen();
    } else if (videoRef.current.msRequestFullscreen) {
      /* IE/Edge */
      videoRef.current.msRequestFullscreen();
    }
  };

  const changeAudio = (lang) => {
    console.log("currentAudio is:", currentAudio);
    console.log("Changing audio to:", lang);

    // Step 1: get current time from the previous audio
    const prevAudioElement = document.getElementById(currentAudio + "-audio");
    const prevTime = prevAudioElement ? prevAudioElement.currentTime : 0;
    console.log("Previous time:", prevTime);

    let newAudioElement = null;

    // Step 2: pause all except the new one
    Object.keys(props.audios).forEach((key) => {
      const audioElement = document.getElementById(key + "-audio");
      if (!audioElement) return;

      if (key !== lang) {
        audioElement.pause();
      } else {
        newAudioElement = audioElement;
      }
    });

    // Step 3: set currentTime on the new audio (after metadata is loaded)
    if (newAudioElement) {
      const seekTo = prevTime;

      if (newAudioElement.readyState >= 1) {
        newAudioElement.currentTime = seekTo;
      } else {
        newAudioElement.addEventListener(
          "loadedmetadata",
          () => {
            newAudioElement.currentTime = seekTo;
          },
          { once: true }
        );
      }

      // Step 4: play and update state
      if (!videoRef.current.paused) {
        // if (isPlaying) {
        newAudioElement.play().catch((err) => console.log("Play error:", err));
      }

      setCurrentAudio(lang);
      setCurrentTime(seekTo);
    }
  };

  const handleSeek = (event) => {
    console.log("Seeked video");
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const seekBarWidth = rect.width;
    const seekPercentage = clickX / seekBarWidth;
    const videoElement = videoRef.current;
    setDuration(videoElement.duration);
    if (videoElement) {
      const newTime = seekPercentage * videoElement.duration;
      videoElement.currentTime = newTime;
      sendCurrentTimeToServer(newTime, isPlaying);
      setCurrentTime(newTime);
      syncAudioTime(newTime);
    }
    console.log("Seeked video ended");
  };

  const handlePlayPause = () => {
    console.log("Handle Play/Pause clicked");
    const defaultAudioKey = Object.keys(props.audios || {})[0] || "";

    if (currentAudio === "" && defaultAudioKey !== "") {
      changeAudio(defaultAudioKey);
    }

    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      // if (!isPlaying) {
      videoElement.muted = true;
      videoElement.play().catch((err) => console.log("Video play error:", err));
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
    console.log("currentAudio is before ending Play/Pause:", currentAudio);
    console.log("Handle Play/Pause clicked eneded");
  };

  const onPlay = () => {
    console.log("CurrentAudio in onPlay is:", currentAudio);
    console.log("Video onPlay triggered");
    syncAudioTime();
    setIsPlaying(true);
    if (isRemoteAction.current) {
      isRemoteAction.current = false;
    } else {
      console.log(
        "sending play action to server because isRemoteAction.current: ",
        isRemoteAction.current
      );
      sendCurrentTimeToServer(videoRef.current.currentTime, true);
    }
    console.log("CurrentAudio in onPlay before ending:", currentAudio);
    console.log("Video onPlay triggered ended");
  };

  const onPause = () => {
    console.log("Video onPause triggered");
    const audioElement = document.getElementById(currentAudio + "-audio");
    setIsPlaying(false);
    syncAudioTime();
    if (isRemoteAction.current) {
      isRemoteAction.current = false;
    } else {
      console.log(
        "sending pause action to server because isRemoteAction.current: ",
        isRemoteAction.current
      );
      sendCurrentTimeToServer(videoRef.current.currentTime, false);
    }
    if (audioElement) {
      console.log("Pausing audio as video is paused");
      audioElement.pause();
    }
    console.log("Video onPause triggered ended");
  };

  const formatTime = (timeInSeconds) => {
    let minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    let hours = 0;

    if (minutes > 59) {
      hours = Math.floor(minutes / 60);
      minutes = minutes % 60;
    }

    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");
    const paddedHours = String(hours).padStart(2, "0");

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  };

  const syncAudioTime = (syncTime) => {
    console.log("Syncing audio time with video");
    const currentTime =
      syncTime !== undefined ? syncTime : videoRef.current?.currentTime;

    // const audioElement = document.getElementById(currentAudio + "-audio");
    const audioElement = document.getElementById(
      currentAudioRef.current + "-audio"
    );

    if (audioElement) {
      audioElement.currentTime = currentTime;
      if (!videoRef.current.paused) {
        console.log("!videoRef.current.paused is: ", !videoRef.current.paused);
        console.log(
          "Playing audio as video is playing as isPlaying is: ",
          isPlaying
        );
        /* videoRef.current
          .play()
          .catch((err) => console.log("Video play error:", err)); */
        console.log("Playing audio element:", audioElement);
        audioElement
          .play()
          .catch((err) => console.log("Audio play error:", err));
      } else {
        console.log("!videoRef.current.paused is: ", !videoRef.current.paused);
        console.log(
          "Pausing audio as video is paused as isPlaying is: ",
          isPlaying
        );
        audioElement.pause();
      }
    } else {
      console.warn("⚠️ Audio element not found:", currentAudio + "-audio");
    }
    console.log("Syncing audio time ended");
  };

  const syncwithServer = (playState, serverTime) => {
    isRemoteAction.current = true;
    console.log(
      "Syncing with server. PlayState:",
      playState,
      "ServerTime:",
      serverTime
    );

    videoRef.current.currentTime = serverTime;
    syncAudioTime(serverTime);

    if (playState) {
      console.log("playstate is: ", playState, "playing video: ", playState);
      setIsPlaying(true);
      videoRef.current.play().catch((err) => console.log("Play error:", err));
    } else {
      console.log("playstate is: ", playState, "playing video: ", playState);
      setIsPlaying(false);
      videoRef.current.pause();
    }
  };

  const sendCurrentTimeToServer = (time, isPlaying) => {
    console.log("Sending current time to server: ", time);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ isPlaying: isPlaying, currentTime: time }));
    }
  };

  /* useEffect(() => {
    // Old
    let socket;

    try {
      // Try local WebSocket first
      socket = new WebSocket("ws://192.168.29.88:8001");
    } catch (err) {
      // If it fails, fallback to ngrok WSS
      console.warn("Local WebSocket failed, falling back to ngrok WSS", err);
      socket = new WebSocket("wss://c1dd27c45d10.ngrok-free.app");
    }
    // New

    setWs(socket);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      // handle incoming message
      console.log("Message from server:", event.data);
      const data = JSON.parse(event.data);
      if (data.currentTime !== undefined) {
        videoRef.current.muted = true;
        syncwithServer(data.isPlaying, data.currentTime);
      }
    };

    socket.onclose = () => {
      console.log("⚠️ WebSocket closed. Reconnecting in 2s...");
      setTimeout(
        (socket.onopen = () => {
          console.log("WebSocket reconnected");
        }),
        2000
      ); // auto reconnect
    };

    // connectWebSocket();

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration || 0);
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        videoRef.current.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      }
      socket.close();
    };
  }, []); // run once when component mounts */

  useEffect(() => {
    currentAudioRef.current = currentAudio;
  }, [currentAudio]);

  useEffect(() => {
    let socket;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket("ws://192.168.29.88:8001");
      } catch (err) {
        console.warn("Local WebSocket failed, falling back to ngrok WSS", err);
        socket = new WebSocket("wss://c1dd27c45d10.ngrok-free.app");
      }

      setWs(socket); // keep latest socket in state

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      socket.onmessage = (event) => {
        console.log("📩 Message from server:", event.data);
        const data = JSON.parse(event.data);

        if (data.currentTime !== undefined) {
          // mute video (avoid feedback loop if streaming audio back)
          if (videoRef.current) {
            videoRef.current.muted = true;
          }
          // sync local player
          syncwithServer(data.isPlaying, data.currentTime);
        }
      };

      socket.onclose = () => {
        console.log("⚠️ WebSocket closed. Reconnecting in 2s...");
        setTimeout(connectWebSocket, 2000); // 🔄 recursive reconnect
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        socket.close(); // trigger onclose → reconnect
      };
    };

    connectWebSocket();

    // 🎥 Video event listeners
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration || 0);
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    // 🧹 Cleanup on unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        videoRef.current.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      }
      if (socket) socket.close();
    };
  }, []); // re-run if currentAudio changes

  return (
    <>
      <div className="spacer" />
      <div className="video-container">
        {/* Video Container */}
        <div
          className="video-wrapper"
          onMouseEnter={() => setVideoHovered(true)}
          onMouseLeave={() => setVideoHovered(false)}
        >
          <video
            ref={videoRef}
            className="video-element"
            onPlay={onPlay}
            onPause={onPause}
          >
            <source src={props.path} type="video/mp4" />
            {/* Subs */}
            {props.subs &&
              Object.entries(props.subs).map(([key, value]) => (
                <track
                  key={key}
                  src={value}
                  kind="subtitles"
                  // srcLang={key}
                  label={key.toUpperCase()}
                  crossorigin="anonymous"
                />
              ))}
          </video>

          {/* Video Overlay Controls */}
          <div className={`video-overlay ${videoHovered ? "hovered" : ""}`}>
            <button
              onClick={handlePlayPause}
              className={`overlay-button ${videoHovered ? "visible" : ""} ${
                playButtonHovered ? "hovered" : ""
              }`}
              onMouseEnter={() => setPlayButtonHovered(true)}
              onMouseLeave={() => setPlayButtonHovered(false)}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          {/* Seeking Bar */}
          <div className="seek-bar-container">
            <span className="time-display">{formatTime(currentTime)}</span>
            <div
              className="seek-bar"
              onClick={(event) => {
                handleSeek(event);
              }}
            >
              <div
                className="seek-bar-progress"
                style={{
                  inlineSize: duration
                    ? `${(currentTime / duration) * 100}%`
                    : "0%",
                }}
              />
            </div>
            <span className="time-display">{formatTime(duration)}</span>

            {/* Fullscreen button next to seeking line */}
            <button
              className={`fullscreen-button ${
                fullscreenButtonHovered ? "hovered" : ""
              }`}
              onMouseEnter={() => setFullscreenButtonHovered(true)}
              onMouseLeave={() => setFullscreenButtonHovered(false)}
              onClick={fullscreen}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>

          {/* Main Controls */}
          <div className="main-controls">
            <button
              onClick={handlePlayPause}
              className={`play-button ${playButtonHovered ? "hovered" : ""}`}
              onMouseEnter={() => setPlayButtonHovered(true)}
              onMouseLeave={() => setPlayButtonHovered(false)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Play</span>
            </button>
          </div>

          {/* Audio Track Selection */}
          {props.audios && Object.keys(props.audios).length > 0 && (
            <div className="audio-section">
              <div className="audio-header">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span className="audio-header-text">Audio Tracks</span>
              </div>

              <div className="audio-tracks">
                {Object.entries(props.audios).map(([key, value]) => (
                  <AudioButton
                    key={key + "-container"}
                    audioKey={key}
                    audioValue={value}
                    isActive={currentAudio === key}
                    onClick={() => {
                      changeAudio(key);
                    }}
                  />
                ))}
              </div>
              <div className="sub-tracks"></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Video;
