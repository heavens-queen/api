import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ObjectIdentifier,
} from "@aws-sdk/client-s3";
import { s3 } from "../../config/s3Config.js";
import { NextFunction, Request, Response } from "express";
import { listObjectsWithPrefix } from "./helper/SinglePrefixObjects.js";
import { listObjectsWithPrefixBatch } from "./helper/ObjectsWithPrefixBatch.js";

export async function deleteImageAndThumbnail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.query.userId;
    const { imageId, imageIds } = req.body;
  
    // Validate userId
    if (!userId) {
      return res.status(400).json({
        error: "Missing userId. Please navigate to your profile and retrieve your userId",
      });
    }
  
    // Validate imageId or imageIds
    if (!imageId && (!imageIds || !Array.isArray(imageIds))) {
      return res.status(400).json({
        error: "Missing Image ID or invalid imageIds",
      });
    }
  
    try {
      if (imageId) {
        const imagePrefix = `${userId}/images/${imageId}`;
        const thumbnailPrefix = `${userId}/images/thumbnails/${imageId}`;
  
        // List objects with the specified prefixes
        const imageKeys = await listObjectsWithPrefix(
          process.env.BUCKET_NAME || "",
          imagePrefix
        );
        const thumbnailKeys = await listObjectsWithPrefix(
          process.env.BUCKET_NAME || "",
          thumbnailPrefix
        );
  
        // Concatenate keys from both prefixes
        const keysToDelete = [...imageKeys, ...thumbnailKeys];
  
        // Check if there are any files to delete
        if (keysToDelete.length === 0) {
          return res.status(400).json({
            error: "No files found with the specified prefixes.",
          });
        }else{

        // Delete files with the extracted keys
        const deleteParams = {
          Bucket: process.env.BUCKET_NAME || "",
          Delete: {
            Objects: keysToDelete.map((Key) => ({ Key })),
            Quiet: false,
          },
        };
  
        const response = await s3.send(new DeleteObjectsCommand(deleteParams));
  
        // Check if any errors occurred during deletion
        if (response.Errors && response.Errors.length > 0) {
            console.log("Error deleting images from S3 bucket",response.Errors);
          return res.status(400).json({
            error: "Some errors occurred during deletion. Check the Errors array for details.",
            detailedErrors: response.Errors,
          });
        }
  
        res.json({ success: true, message: "Image deleted successfully" });
    }
      }  else if (imageIds) {
        const Objects: ObjectIdentifier[] = imageIds.flatMap((imageId: any) => {
          const imagePrefix = `${userId}/images/${imageId}`;
          const thumbnailPrefix = `${userId}/images/thumbnails/${imageId}`;
          return [{ Key: imagePrefix }, { Key: thumbnailPrefix }];
        });
  
        // List objects with the specified prefixes
        const keysToDelete = await listObjectsWithPrefixBatch(
          process.env.BUCKET_NAME || "",
          Objects
        )||  [];
  console.log("keys",keysToDelete)
        // Check if there are any files to delete
        if (keysToDelete.length === 0) {
          return res.status(400).json({
            error: "No files found with the specified prefixes.",
          });
        }else{
                    
  
        // Delete files with the extracted keys
        const deleteParams = {
          Bucket: process.env.BUCKET_NAME || "",
          Delete: {
            Objects: keysToDelete.map((Key) => ({ Key })),
            Quiet: false,
          },
        };
  
        const response = await s3.send(new DeleteObjectsCommand(deleteParams));
  
        // Check if any errors occurred during deletion
        if (response.Errors && response.Errors.length > 0) {

          return res.status(400).json({
            error: "Some errors occurred during deletion. Check the Errors array for details.",
            detailedErrors: response.Errors,
          });
        }
  
        res.json({ success: true, message: "Images deleted successfully" });
        }
    }
    } catch (error) {
      next(error);
    }
  }