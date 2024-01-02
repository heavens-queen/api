import { v4 as uuidv4 } from "uuid";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { compressVideo } from "./helper/object/CompressVideo.js";
import { uploadVideoFileToAWS } from "./helper/object/UploadToAws.js";
import { generateVideoThumnail } from "./helper/thumbnail/generateThumnail.js";
import { uploadThumbnailToAWS } from "./helper/thumbnail/uploadThumnail.js";

export const uploadVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const videoBuffer = req.file?.buffer;
    const userId = req.query.userId;
    console.log("req.file:", req.file);
    const tempFilePath = req.file?.path || "";
    console.log("tempFilePath", tempFilePath);
    if (!tempFilePath) {
      throw new Error("No file uploaded");
    }
    const bucketName = process.env.BUCKET_NAME || "";
    const fileName= uuidv4();
    const objectKey = `${userId}/videos/${fileName}.mp4`;
    const thumnailKey=`${userId}/videos/Thumnails/${fileName}.jpg`
    
    const generateThumbnail=await generateVideoThumnail(tempFilePath);
    const thumnailUrl = await uploadThumbnailToAWS(bucketName, thumnailKey, generateThumbnail as string)
    const compressedFilePath = await compressVideo(tempFilePath);
   
    const compressedFileSize = (
      fs.statSync(compressedFilePath as string).size /
      1024 /
      1024
    ).toFixed(2);
    const url = await uploadVideoFileToAWS(
      bucketName,
      objectKey,
      compressedFilePath as string
    );

    const originalFileSize = ((req.file?.size ?? 0) / (1024 * 1024)).toFixed(2);
    const compressionPercentage =
      Math.round(
        (100 - (Number(compressedFileSize) / Number(originalFileSize)) * 100) *
          100
      ) / 100;

    // Delete the file after successful upload

    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
      console.log("Temporary file deleted successfully.");
    }
  
    res.status(200).json({
      key: fileName,
      thumnailUrl,
      videoUrl: url,
      message: "video uploaded successfully",
      originalFileSize: `${originalFileSize} MB`,
      compressedFileSize: `${compressedFileSize} MB`,
      compressionPercentage: `${compressionPercentage}%`,
    });
  } catch (err: any) {
    console.error("An error occurred: " + err.message);
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
      console.log("Temporary file deleted successfully.");
    }
    next(err);
  }
};
