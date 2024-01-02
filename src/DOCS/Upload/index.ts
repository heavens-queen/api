import express, { NextFunction } from "express";
import multer from "multer";
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3,
} from "@aws-sdk/client-s3";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import os from "os";
import { s3 } from "../../config/s3Config.js";
import { v4 as uuid } from "uuid";

export const uploadFiles = async (
  req: express.Request,
  res: express.Response,
  next:NextFunction
) => {
  const userId = req.query.userId;
  const key = `${userId}/files`;
  const files = req.files as Express.Multer.File[];
  try {
   
console.log('files',files)
    if (files.length === 1) {
      // Upload single file directly to S3

      const file = files[0];
      const objectKey = `${uuid()}-${file.originalname}`;
      const uploadParams: PutObjectCommandInput = {
        Bucket: process.env.BUCKET_NAME || "",
        Key: `${key}/${objectKey}`,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
        Metadata: {
          "Content-Disposition": "inline",
        },
      };

      const result = await s3.send(new PutObjectCommand(uploadParams));
    if(file.path){
      fs.unlinkSync(file.path);
      console.log(`file :${file.path} was deleted succefully`)

    }
      res.status(200).json({
        message: "File uploaded successfully",
        key: objectKey,
        url:`https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}/${objectKey}`
      });
    } else {
      // Zip multiple files and upload the zip file to S3
      const zipFileName = `${uuid()}-files.zip`;
      const zipPath = path.join(os.tmpdir(), zipFileName);

      const archive = archiver("zip", {
        zlib: { level: 9 }, // Compression level
      });

      const zipStream = fs.createWriteStream(zipPath);
      archive.pipe(zipStream);

      // Remove each temporary file after adding to the archive
      files.forEach((file) => {
        archive.append(fs.createReadStream(file.path), {
          name: file.originalname,
        });

      });
      archive.finalize();

      zipStream.on("close", async () => {
        try {
          const uploadParams: PutObjectCommandInput = {
            Bucket: process.env.BUCKET_NAME || "",
            Key: `${key}/${zipFileName}`,
            Body: fs.createReadStream(zipPath),
            ContentType: "application/zip",
            Metadata: {
              "Content-Disposition": "inline",
            },
          };

          const result = await s3.send(new PutObjectCommand(uploadParams));
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath); //Delete temporary file
            console.log(` Zip file deleted:${zipPath} `)
          } else {
            console.warn(`Zip File not found: ${zipPath}`);
          }

          if(files){
            files.forEach((file) => {
              // Check if the file exists before attempting to unlink it
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(`file deleted after zipping at :${file.path} `)
              } else {
                console.warn(`File not found on zipping : ${file.path}`);
              }
            });
        
          }
        
          res.status(200).json({
            message: "Files zipped and uploaded successfully",
            key: zipFileName,
            url:`https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}/${zipFileName}`
          });
        } catch (err: any) {
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath); //Delete temporary file
            console.log(` Zip file deleted:${zipPath} `)
          } else {
            console.warn(`Zip File not found: ${zipPath}`);
          }
          throw new Error(err);
        }
      });
    }
  } catch (error) {
    console.error("Error uploading files:", error);
   
    console.log("in the error",files);
    // Handle error and remove temporary files
    if(files){
      files.forEach((file) => {
        // Check if the file exists before attempting to unlink it
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`file deleted on error at :${file.path} `)
        } else {
          console.warn(`File not found on error : ${file.path}`);
        }
      });
    }

    next(error)
  }
};
