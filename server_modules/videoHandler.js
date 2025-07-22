// Define jsonData or fetch it from a source
let jsonData = null; // or assign actual data if available

const VideoCode = new Promise((resolve, reject) => {
  if (jsonData) {
    resolve(jsonData); // resolve with the actual data
  } else {
    reject("No video codec data available");
  }
});

VideoCode.then((data) => {
  // Use the data directly, or parse if it's a JSON string
  // jsonData = JSON.parse(data); // Uncomment if 'data' is a JSON string
  console.log("Video codec data:", data);
}).catch((error) => {
  console.error("Error in VideoCodec promise:", error);
});
