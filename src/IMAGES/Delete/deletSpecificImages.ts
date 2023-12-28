import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ObjectIdentifier,
} from "@aws-sdk/client-s3";
import { s3 } from "../../config/s3Config.js";
import { NextFunction, Request, Response } from "express";
export async function deleteImageAndThumbnail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.query.userId;
    const { imageId, imageIds } = req.body;
  
    // Validate userId
    if (!userId) return res.status(400).json({ error: 'Missing userId. Please navigate to your profile and retrieve your userId' });
  
    // Validate imageId or imageIds
    if (!imageId && (!imageIds || !Array.isArray(imageIds))) {
      return res.status(400).json({ error: "Missing Image ID or invalid imageIds" });
    }
  
    try {
      if (imageId) {
        const imagePrefix = `${userId}/images/${imageId}`;
        const thumbnailPrefix = `${userId}/images/thumbnails/${imageId}`;
  
        // Delete all images and thumbnails
        const deleteParams = {
          Bucket: process.env.BUCKET_NAME || "",
          Delete: {
            Objects: [{ Key: imagePrefix }, { Key: thumbnailPrefix }],
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
   console.log(response);
        res.json({ success: true, message: "Image deleted successfully" });
      } else if (imageIds) {
        const Objects: ObjectIdentifier[] = imageIds.flatMap((imageId: any) => {
          const imagePrefix = `${userId}/images/${imageId}`;
          const thumbnailPrefix = `${userId}/images/thumbnails/${imageId}`;
          return [{ Key: imagePrefix }, { Key: thumbnailPrefix }];
        });
  
        // Delete all images and thumbnails
        const deleteParams = {
          Bucket: process.env.BUCKET_NAME || "",
          Delete: {
            Objects,
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
    } catch (error) {
      next(error);
    }
  }
