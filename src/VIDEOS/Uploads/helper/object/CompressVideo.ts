import fs from "fs";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpath } from "@ffmpeg-installer/ffmpeg";
import { v4 as uuidv4 } from "uuid";

ffmpeg.setFfmpegPath(ffmpath);

const targetResolution = "640:-1";

// Modify compressVideoToBuffer to accept a buffer directly
export  const compressVideo = (inputFilePath: string) => {
  return new Promise((resolve, reject) => {
    
    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.mp4`);

    ffmpeg()
      .input(inputFilePath)
      .inputFormat("mp4")
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        '-preset veryfast',
        "-crf 23",
        "-vf",
        `scale=${targetResolution}`,
      ])
      .toFormat("mp4")
      .output(tempFilePath)
      .on("error", (err: { message: string }, stdout, stderr) => {
        console.error("An error occurred on compressing: " + err.message);
        console.log(err.message);
        console.log("stdout:\n" + stdout);
        console.log("stderr:\n" + stderr);

        reject(err);
      })
      .on("end", () => {
        console.log("Compression finished!");
        resolve(tempFilePath);
      })
      .run();
  });
};