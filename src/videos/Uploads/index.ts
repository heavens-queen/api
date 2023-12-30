import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpath } from '@ffmpeg-installer/ffmpeg';
import { s3 } from "../../config/s3Config.js";
import { PutObjectCommand ,CreateMultipartUploadCommand,  UploadPartCommand,CompleteMultipartUploadCommand} from "@aws-sdk/client-s3";
import streamBuffers from 'stream-buffers';
import { v4 as uuidv4 } from 'uuid';
import { NextFunction ,Request,Response} from "express";
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpath);

export const uploadVideo= async (req:Request, res:Response,next:NextFunction) => {
    try {
      // const videoBuffer = req.file?.buffer;
      const userId=req.query.userId;
      const tempFilePath = req.file?.path;
  
      // const compressedBuffer = await compressVideoToBuffer(tempFilePath);
     // Usage
  const compressedFilePath = await compressVideoToBuffer(tempFilePath);
  const bucketName = process.env.BUCKET_NAME || '';
  const objectKey = `${userId}/videos/${uuidv4()}.mp4`;
  // await uploadVideoFileToAWS(bucketName, objectKey, compressedFilePath as string);
    // Delete the file after successful upload
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
      console.log('Temporary file deleted successfully.');
    }

      res.status(200).send('Video uploaded successfully!');
    } catch (err:any) {
    console.error('An error occurred: ' + err.message);
    // Delete the file in case of an error
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
      console.log('Temporary file deleted due to error.');
    }
    next(err);
  }
}

// Your existing functions...
// Create a function to upload the video buffer to S3 using multipart upload
const uploadVideoFileToAWS = async (bucket: string, key: string, filePath:  string) => {
  try {
    // Create the multipart upload parameters with the bucket and key
    const createMultipartUploadParams = {
      Bucket: bucket,
      Key: key,

    };

    // Send the CreateMultipartUploadCommand with the parameters
    const { UploadId } = await s3.send(new CreateMultipartUploadCommand(createMultipartUploadParams));

    // Log the upload ID
    console.log('Upload ID: ' + UploadId);

    // Initialize an array to store the uploaded parts
    const parts = [];

    // Initialize a variable to track the current part number
    let partNumber = 0;
    
    const videoBuffer = fs.readFileSync(filePath);

    // Loop through the buffer and upload each chunk as a part
    const chunkSize = 5 * 1024 * 1024; 
    for (let start = 0; start <  videoBuffer.length; start += chunkSize) {
      // Increment the part number
      partNumber++;

      // Slice the buffer to get the current chunk
      const end = Math.min(start + chunkSize, videoBuffer.length);
      const chunk = Uint8Array.prototype.slice.call(videoBuffer, start, end);


      // Create the upload part parameters with the bucket, key, upload ID, part number and chunk
      const uploadPartParams = {
        Bucket: bucket,
        Key: key,
        UploadId: UploadId,
        PartNumber: partNumber,
        Body: chunk
      };

      // Send the UploadPartCommand with the parameters
      const { ETag } = await s3.send(new UploadPartCommand(uploadPartParams));

      // Log the part number and ETag
      console.log('Part number: ' + partNumber + ', ETag: ' + ETag);

      // Push the part number and ETag to the parts array
      parts.push({
        PartNumber: partNumber,
        ETag: ETag
      });
    }

    // Create the complete multipart upload parameters with the bucket, key, upload ID and parts
    const completeMultipartUploadParams = {
      Bucket: bucket,
      Key: key,
      UploadId: UploadId,
      MultipartUpload: {
        Parts: parts
      },
      // ContentType: 'video/mp4',
      ContentDisposition: 'inline', // or 'attachment' if you want to force download
    };

    // Send the CompleteMultipartUploadCommand with the parameters
    const { Location, Bucket, Key } = await s3.send(new CompleteMultipartUploadCommand(completeMultipartUploadParams));

    // Log the location, bucket and key of the uploaded object
    console.log('Upload finished!');
    console.log('Location: ' + Location);
    console.log('Bucket: ' + Bucket);
    console.log('Key: ' + Key);
    fs.unlinkSync(filePath);

  } catch (err: any) {
   // Handle any errors that occur during upload
   console.error('An error occurred: ' + err.message);
    
   // Delete the temporary file in case of an error
   try {
     fs.unlinkSync(filePath);
     console.log('Temporary file deleted due to error.');
   } catch (unlinkError:any) {
     console.error('Error deleting temporary file:', unlinkError.message);
   }
  }
};

const targetResolution = '640:-1';

// Modify compressVideoToBuffer to accept a buffer directly
const compressVideoToBuffer = (inputBuffer: any) => {
  return new Promise((resolve, reject) => {
    console.log('Input Buffer Size:', inputBuffer.length);

    // const outputBuffer = new streamBuffers.WritableStreamBuffer();
    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.mp4`);
const outuput='/home/glen/Desktop/mediaGlens/temp/output.mp4'
    ffmpeg() 
      .input(inputBuffer)
      .inputFormat('mp4')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset veryfast',
        '-crf 23',
        '-vf', `scale=${targetResolution}`,
        
      ])
      .toFormat('mp4')
      .output(outuput)
      .on('error', (err: { message: string; } ,stdout, stderr) => {
        console.error('An error occurred: ' + err.message);
        console.log(err.message);
            console.log("stdout:\n" + stdout);
            console.log("stderr:\n" + stderr);

        reject(err);
      })
      .on('end', () => {
        console.log('Compression finished!');
        resolve(tempFilePath);
      })
      .run();
  });
};

