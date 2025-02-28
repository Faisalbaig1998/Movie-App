import { useEffect, useRef } from "react";

const Video = (props) => {
  const videoRef = useRef(null);

  useEffect(() => {
    console.log("We are in Video.js and here is the props", props.path);
    if (props.path) {
      videoRef.current.src = props.path;
    }
  }, [props.path]);
  return (
    <>
      <br />
      <video width="320" height="240" ref={videoRef} controls>
        <source src={props.path} type="video/mp4" />
        {/* <source src="movie.ogg" type="video/mp4" /> */}
      </video>
    </>
  );
};

export default Video;
