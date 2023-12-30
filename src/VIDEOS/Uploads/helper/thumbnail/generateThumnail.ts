
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpath } from "@ffmpeg-installer/ffmpeg";
import { v4 as uuidv4 } from "uuid";

ffmpeg.setFfmpegPath(ffmpath);

const targetResolution = "640:-1";

// Modify compressVideoToBuffer to accept a buffer directly
export  const generateVideoThumnail = (inputFilePath: string) => {
  return new Promise((resolve, reject) => {
    
    const thumbnailFilePath = path.join(os.tmpdir(), `${uuidv4()}.jpg`);

    ffmpeg()
      .input(inputFilePath)
      .seekInput('00:00:01')   // Seek to 1 second into the video
      .frames(1)               // Capture only one frame
      .output(thumbnailFilePath)
      .on("error", (err: { message: string }, stdout, stderr) => {
        console.error("An error occurred on compressing: " + err.message);
        console.log(err.message);
        console.log("stdout:\n" + stdout);
        console.log("stderr:\n" + stderr);

        reject(err);
      })
      .on("end", () => {
        console.log("Compression finished!");
        resolve(thumbnailFilePath);
      })
      .run();
  });
};