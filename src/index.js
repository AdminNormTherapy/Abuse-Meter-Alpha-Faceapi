import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import {
  loadTinyFaceDetectorModel,
  detectSingleFace,
  TinyFaceDetectorOptions,
  resizeResults,
  matchDimensions,
  draw,
  loadFaceLandmarkTinyModel
} from "face-api.js";

import "./styles.css";

const App = () => {
  const [video, setVideo] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [detected, setDetected] = useState(false);
  const [camera, setCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  useEffect(() => {
    setVideo(videoRef.current);
    setCanvas(canvasRef.current);
  }, []);

  const start = async () => {
    await launchCamera();
    const recognition = makeRecognition();
    await recognition.init();
    recognition.start();
  };

  const getFaceDetectorOptions = () =>
    new TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

  const makeRecognition = () => {
    let ctx;

    const init = async () => {
      setLoading(true);
      await loadTinyFaceDetectorModel(`models`);
      await loadFaceLandmarkTinyModel("models");
      ctx = canvas.getContext("2d");
    };

    const start = async () => {
      await wait(0);
      if (video.readyState === 4) {
        const faces = await detectSingleFace(
          video,
          getFaceDetectorOptions()
        ).withFaceLandmarks(true);
        setLoading(false);
        if (faces) {
          setDetected(true);
          const dims = matchDimensions(canvas, video, true);
          const resizedResults = resizeResults(faces, dims);
          console.log(resizedResults);
		  
		  const addPosts = async () => {
			 await fetch('https://lmh52lzc9a.execute-api.us-east-1.amazonaws.com/dev/vectors', {
				method: 'POST',
				body: JSON.stringify({
				   user_id: "demo",
				   datetime: new Date().toISOString(),
				   datastring: JSON.stringify(resizedResults),
				}),
				headers: {
				   'Content-type': 'application/json; charset=UTF-8',
				},
			 })
				.then((response) => response.json())
				.then((data) => {
				   setPosts((posts) => [data, ...posts]);
				})
				.catch((err) => {
				   console.log(err.message);
				});
		  };
		  
		  addPosts();
		  
          if (true) {
            draw.drawDetections(canvas, resizedResults);
          }
          if (true) {
            draw.drawFaceLandmarks(canvas, resizedResults);
          }
        } else {
          setDetected(false);
          ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
        }
      }
      start();
    };

    return { init, start };
  };

  const launchCamera = () =>
    new Promise(resolve => {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            mandatory: {
              minWidth: 412,
              maxWidth: 412,
              minHeight: 412,
              maxHeight: 412,
              minFrameRate: 1,
              maxFrameRate: 10
            }
          }
        })
        .then(
          stream => {
            video.srcObject = stream;
            video.play();
            setCamera(true);
            resolve();
          },
          () => {}
        );
    });

  return (
    <div>
      {!camera && (
        <button
          style={{
            padding: 20,
            fontSize: 14
          }}
          onClick={() => {
            start();
          }}
        >
          Launch Camera
        </button>
      )}
      <video
        style={{ position: "absolute", top: 70, left: 10 }}
        ref={videoRef}
      />
      <canvas
        style={{ position: "absolute", top: 70, left: 10 }}
        ref={canvasRef}
      />
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 10,
            width: 320,
            height: 240,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          Loading
        </div>
      )}
      {camera}
    </div>
  );
};

const wait = time => new Promise(resolve => setTimeout(resolve, time));

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
