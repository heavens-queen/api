import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../../../../config/s3Config.js";
import fs from "fs";
// Create a function to upload the video buffer to S3 using multipart upload
export const uploadVideoFileToAWS = async (
  bucket: string,
  key: string,
  filePath: string
) => {
  try {
    // Create the multipart upload parameters with the bucket and key
    const createMultipartUploadParams = {
      Bucket: bucket,
      Key: key,
    };

    // Send the CreateMultipartUploadCommand with the parameters
    const { UploadId } = await s3.send(
      new CreateMultipartUploadCommand(createMultipartUploadParams)
    );

    // Log the upload ID
    console.log("Upload ID: " + UploadId);

    // Initialize an array to store the uploaded parts
    const parts = [];

    // Initialize a variable to track the current part number
    let partNumber = 0;

    const videoBuffer = fs.readFileSync(filePath);

    // Loop through the buffer and upload each chunk as a part
    const chunkSize = 5 * 1024 * 1024;
    for (let start = 0; start < videoBuffer.length; start += chunkSize) {
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
        Body: chunk,
      };

      // Send the UploadPartCommand with the parameters
      const { ETag } = await s3.send(new UploadPartCommand(uploadPartParams));

      // Log the part number and ETag
      console.log("Part number: " + partNumber + ", ETag: " + ETag);

      // Push the part number and ETag to the parts array
      parts.push({
        PartNumber: partNumber,
        ETag: ETag,
      });
    }

    // Create the complete multipart upload parameters with the bucket, key, upload ID and parts
    const completeMultipartUploadParams = {
      Bucket: bucket,
      Key: key,
      UploadId: UploadId,
      MultipartUpload: {
        Parts: parts,
      },
      ContentDisposition: "inline", // or 'attachment' if you want to force download
      ContentType: 'video/mp4',
    };

    // Send the CompleteMultipartUploadCommand with the parameters
    const { Location, Bucket, Key } = await s3.send(
      new CompleteMultipartUploadCommand(completeMultipartUploadParams)
    );
    

    // Log the location, bucket and key of the uploaded object
    console.log("Upload finished!");
    console.log("Location: " + Location);
    console.log("Bucket: " + Bucket);
    console.log("Key: " + Key);
    fs.unlinkSync(filePath);
    return `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (err: any) {
    // Handle any errors that occur during upload
    console.error("An error occurred on uploading to aws: " + err.message);

    // Delete the temporary file in case of an error
    try {
      fs.unlinkSync(filePath);
      console.log("Temporary file deleted due to error.");
    } catch (unlinkError: any) {
      console.error("Error deleting temporary file:", unlinkError.message);
    }
  }
};
