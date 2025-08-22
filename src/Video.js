import { useEffect, useRef, useState } from "react";

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Separate component for audio buttons to handle hover state
const AudioButton = ({ audioKey, audioValue, isActive, onClick, styles }) => {
  const [buttonHovered, setButtonHovered] = useState(false);

  return (
    <div>
      <audio id={audioKey + "-audio"} src={audioValue} preload="auto" hidden />
      <button
        onClick={onClick}
        style={{
          ...styles.audioButton,
          ...(isActive
            ? styles.audioButtonActive
            : buttonHovered
            ? styles.audioButtonInactiveHover
            : styles.audioButtonInactive),
        }}
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
  const [audio, setAudio] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoHovered, setVideoHovered] = useState(false);
  const [playButtonHovered, setPlayButtonHovered] = useState(false);
  const [fullscreenButtonHovered, setFullscreenButtonHovered] = useState(false);
  const [ws, setWs] = useState(null);

  // NEW STATE FOR SEEKING
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onPlay = (e) => {
    console.log("Video is playing, current time:", e.target.currentTime);
    e.target.muted = true;
    setIsPlaying(true);
    var audioTag = null;
    if (!audio) {
      audioTag = document.getElementById(
        `${Object.keys(props.audios)[0]}-audio`
      );
      setAudio(Object.keys(props.audios)[0]);
    } else {
      console.log("setting audiotTag in onPlay with audio: ", audio);
      audioTag = document.getElementById(`${audio}-audio`);
    }

    if (audioTag && audioTag.paused) {
      audioTag.play().catch((err) => console.error("Audio play error:", err));
    }
    sendCurrentTimeToWebSocket(e.target.currentTime, "play");
  };

  const sendCurrentTimeToWebSocket = (currentTime, type) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type,
          uCode: props.uCode,
          currentTime: currentTime,
        })
      );
    } else {
      console.warn("WebSocket is not open. Cannot send message.");
    }
  };

  const onPause = (e) => {
    console.log("Video is paused, current time:", e.target.currentTime);
    e.target.muted = true;
    setIsPlaying(false);

    console.log("setting audiotTag in onPause with audio: ", audio);
    const audioTag = document.getElementById(`${audio}-audio`);
    if (audioTag) audioTag.pause();
    sendCurrentTimeToWebSocket(e.target.currentTime, "pause");
  };

  // NEW FUNCTION: Handle time updates
  const onTimeUpdate = (e) => {
    if (!isDragging) {
      setCurrentTime(e.target.currentTime);
    }
  };

  // NEW FUNCTION: Handle when video metadata is loaded
  const onLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  // NEW FUNCTION: Handle seeking
  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    setCurrentTime(newTime);

    // Get current audio element
    let currentAudioEl = null;
    if (audio) {
      currentAudioEl = document.getElementById(`${audio}-audio`);
    } else if (props.audios && Object.keys(props.audios).length > 0) {
      currentAudioEl = document.getElementById(
        `${Object.keys(props.audios)[0]}-audio`
      );
    }

    // Pause both video and audio first
    const wasPlaying = isPlaying;
    videoRef.current.pause();
    if (currentAudioEl) currentAudioEl.pause();

    // Set video time first
    videoRef.current.currentTime = newTime;

    // Wait for video to seek, then sync audio
    const handleVideoSeeked = () => {
      if (currentAudioEl) {
        // Ensure audio is ready and set its time
        if (currentAudioEl.readyState >= 1) {
          currentAudioEl.currentTime = newTime;

          // If was playing, resume both after a small delay to ensure sync
          if (wasPlaying) {
            setTimeout(() => {
              const audioPromise = currentAudioEl
                .play()
                .catch((err) =>
                  console.error("Audio play error after seek:", err)
                );
              const videoPromise = videoRef.current
                .play()
                .catch((err) =>
                  console.error("Video play error after seek:", err)
                );

              Promise.all([audioPromise, videoPromise]);
            }, 100);
          }
        } else {
          // If audio not ready, wait for it
          const handleAudioCanPlay = () => {
            currentAudioEl.currentTime = newTime;
            if (wasPlaying) {
              setTimeout(() => {
                currentAudioEl
                  .play()
                  .catch((err) =>
                    console.error("Audio play error after seek:", err)
                  );
                videoRef.current
                  .play()
                  .catch((err) =>
                    console.error("Video play error after seek:", err)
                  );
              }, 100);
            }
            currentAudioEl.removeEventListener("canplay", handleAudioCanPlay);
          };
          currentAudioEl.addEventListener("canplay", handleAudioCanPlay);
        }
      } else if (wasPlaying) {
        // No audio, just resume video
        videoRef.current
          .play()
          .catch((err) => console.error("Video play error after seek:", err));
      }

      videoRef.current.removeEventListener("seeked", handleVideoSeeked);
    };

    videoRef.current.addEventListener("seeked", handleVideoSeeked);
  };

  // NEW FUNCTION: Format time display
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const changeAudio = (audioKey) => {
    console.log("changeAudio called with audioKey:", audioKey);

    if (!videoRef.current) return;

    console.log("setting current time: ", videoRef.current.currentTime);
    const currentTime = videoRef.current.currentTime;

    // Pause all audio tracks
    Object.keys(props.audios || {}).forEach((key) => {
      const audioEl = document.getElementById(`${key}-audio`);
      if (audioEl) audioEl.pause();
    });

    const newAudio = document.getElementById(`${audioKey}-audio`);
    if (!newAudio) {
      console.warn(`No audio element found for key "${audioKey}"`);
      return;
    }

    // Pause video and audio to avoid race conditions
    videoRef.current.pause();
    newAudio.pause();

    const startPlayback = () => {
      console.log("Startback is running");
      console.log(`Syncing audio "${audioKey}" to time`, currentTime);
      newAudio.currentTime = currentTime;
      videoRef.current.currentTime = currentTime;

      // When audio seek is done, start both in sync
      newAudio.addEventListener(
        "seeked",
        () => {
          console.log("Audio seek complete, starting both video and audio");
          newAudio
            .play()
            .catch((err) => console.error("Audio play error after seek:", err));
          videoRef.current
            .play()
            .catch((err) => console.error("Video play error after seek:", err));
        },
        { once: true }
      );
      console.log("Startback is ending");
    };

    // Wait for metadata before setting time
    if (newAudio.readyState > 0) {
      startPlayback();
    } else {
      newAudio.addEventListener("loadedmetadata", startPlayback, {
        once: true,
      });
    }

    // Always mute video so only audio track plays
    videoRef.current.muted = true;

    // Save selected audio
    setAudio(audioKey);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const syncVideoWithWebSocket = (currentTime, type) => {
    console.log("Syncing function is running: ", currentTime);

    if (type === "play") {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        const audioEl = document.getElementById(`${audio}-audio`);
        if (audioEl) audioEl.currentTime = currentTime;

        // Play video and audio with error handling
        videoRef.current
          .play()
          .catch((err) => console.error("Video play error during sync:", err));

        if (audioEl) {
          audioEl
            .play()
            .catch((err) =>
              console.error("Audio play error during sync:", err)
            );
        }
      }
      console.log("Syncing video with WebSocket play event");
    } else if (type === "pause") {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        const audioEl = document.getElementById(`${audio}-audio`);
        if (audioEl) audioEl.currentTime = currentTime;

        videoRef.current.pause();
        if (audioEl) audioEl.pause();
      }
    }
  };

  useEffect(() => {
    // const ws = new WebSocket("ws://localhost:8001");
    const socket = new WebSocket("ws://localhost:8001");

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);
      console.log("Message from server:", data.type, data.currentTime);
      syncVideoWithWebSocket(data.currentTime, data.type);
    };

    setWs(socket);

    console.log("We are in Video.js and here is the props", props.path);
    if (props.path && videoRef.current) {
      videoRef.current.src = props.path;
    }
  }, [props.path]);

  const styles = {
    container: {
      width: "100%",
      maxWidth: "896px",
      margin: "0 auto",
      background: "linear-gradient(to bottom, #1f2937, #111827)",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    },
    videoContainer: {
      position: "relative",
    },
    video: {
      width: "100%",
      height: "450px",
      backgroundColor: "black",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      objectFit: "cover",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: videoHovered ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0)",
      transition: "background-color 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    overlayButton: {
      backgroundColor: playButtonHovered
        ? "rgba(255, 255, 255, 1)"
        : "rgba(255, 255, 255, 0.9)",
      color: "#1f2937",
      border: "none",
      borderRadius: "50%",
      padding: "16px",
      cursor: "pointer",
      transform: playButtonHovered ? "scale(1.1)" : "scale(1)",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      opacity: videoHovered ? 1 : 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    controlPanel: {
      background: "linear-gradient(to right, #374151, #1f2937)",
      padding: "24px",
    },

    // NEW STYLES FOR SEEKING BAR
    seekBarContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
      padding: "0 4px",
    },
    timeDisplay: {
      color: "#d1d5db",
      fontSize: "14px",
      fontWeight: "500",
      minWidth: "45px",
      textAlign: "center",
    },
    seekBar: {
      flex: 1,
      height: "6px",
      backgroundColor: "#374151",
      borderRadius: "3px",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
    },
    seekBarProgress: {
      height: "100%",
      background: "linear-gradient(to right, #2563eb, #3b82f6)",
      borderRadius: "3px",
      transition: isDragging ? "none" : "width 0.1s ease",
    },

    mainControls: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      marginBottom: "16px",
    },
    playButton: {
      background: "linear-gradient(to right, #2563eb, #3b82f6)",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "50px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      transform: playButtonHovered ? "scale(1.05)" : "scale(1)",
    },
    fullscreenButton: {
      background: "linear-gradient(to right, #374151, #4b5563)",
      color: "white",
      border: "none",
      padding: "12px 16px",
      borderRadius: "50px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      transform: fullscreenButtonHovered ? "scale(1.05)" : "scale(1)",
    },
    audioSection: {
      marginTop: "12px",
    },
    audioHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      color: "#d1d5db",
      marginBottom: "12px",
    },
    audioTracks: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "8px",
    },
    audioButton: {
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    audioButtonActive: {
      backgroundColor: "#2563eb",
      color: "white",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    audioButtonInactive: {
      backgroundColor: "#374151",
      color: "#d1d5db",
    },
    audioButtonInactiveHover: {
      backgroundColor: "#4b5563",
      color: "white",
    },
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <br />
      <div style={styles.container}>
        {/* Video Container */}
        <div
          style={styles.videoContainer}
          onMouseEnter={() => setVideoHovered(true)}
          onMouseLeave={() => setVideoHovered(false)}
        >
          <video
            controls={false}
            ref={videoRef}
            style={styles.video}
            onPlay={onPlay}
            onPause={onPause}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onSeeked={() => {
              videoRef.current.addEventListener("seeked", () => {
                const audioEl = document.getElementById(`${audio}-audio`);
                if (audioEl) audioEl.currentTime = videoRef.current.currentTime;
              });
            }}
          >
            <source src={props.path} type="video/mp4" />
          </video>

          {/* Video Overlay Controls */}
          <div style={styles.overlay}>
            <button
              onClick={handlePlayPause}
              style={styles.overlayButton}
              onMouseEnter={() => setPlayButtonHovered(true)}
              onMouseLeave={() => setPlayButtonHovered(false)}
            >
              {isPlaying ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div style={styles.controlPanel}>
          {/* NEW: Seeking Bar */}
          <div style={styles.seekBarContainer}>
            <span style={styles.timeDisplay}>{formatTime(currentTime)}</span>
            <div
              style={styles.seekBar}
              onClick={handleSeek}
              onMouseEnter={(e) => {
                e.currentTarget.style.height = "8px";
                e.currentTarget.style.marginTop = "-1px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.height = "6px";
                e.currentTarget.style.marginTop = "0px";
              }}
            >
              <div
                style={{
                  ...styles.seekBarProgress,
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
            <span style={styles.timeDisplay}>{formatTime(duration)}</span>
          </div>

          {/* Main Controls */}
          <div style={styles.mainControls}>
            <button
              onClick={handlePlayPause}
              style={styles.playButton}
              onMouseEnter={() => setPlayButtonHovered(true)}
              onMouseLeave={() => setPlayButtonHovered(false)}
            >
              {isPlaying ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <button
              onClick={handleFullscreen}
              style={styles.fullscreenButton}
              onMouseEnter={() => setFullscreenButtonHovered(true)}
              onMouseLeave={() => setFullscreenButtonHovered(false)}
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
              <span
                style={{ display: window.innerWidth > 640 ? "inline" : "none" }}
              >
                Fullscreen
              </span>
            </button>
          </div>

          {/* Audio Track Selection */}
          {props.audios && Object.keys(props.audios).length > 0 && (
            <div style={styles.audioSection}>
              <div style={styles.audioHeader}>
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
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  Audio Tracks
                </span>
              </div>

              <div style={styles.audioTracks}>
                {Object.entries(props.audios).map(([key, value]) => (
                  <AudioButton
                    key={key + "-container"}
                    audioKey={key}
                    audioValue={value}
                    isActive={audio === key}
                    onClick={() => changeAudio(key)}
                    styles={styles}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Video;
