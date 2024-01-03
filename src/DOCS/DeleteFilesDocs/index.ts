import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    ObjectIdentifier,
  } from "@aws-sdk/client-s3";
  import { s3 } from "../../config/s3Config.js";
  import { NextFunction, Request, Response } from "express";
import { listObjectsWithPrefix } from "../../IMAGES/Delete/helper/SinglePrefixObjects.js";
 
  
  export const  deletefileAndThumbnail = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) =>
    {
      const userId = req.query.userId;
      const { key, } = req.body;
    
      // Validate userId
      if (!userId) {
        return res.status(400).json({
          error: "Missing userId. Please navigate to your profile and retrieve your userId",
        });
      }
    
      // Validate key or keys
      if (!key ) {
        return res.status(400).json({
          error: "Missing key or invalid keys",
        });
      }
    
      try {
    
          const filePrefix = `${userId}/files/${key}`;
         
    
          // List objects with the specified prefixes
          const fileKeys = await listObjectsWithPrefix(
            process.env.BUCKET_NAME || "",
            filePrefix
          );
        
    
         
          // Check if there are any files to delete
          if (fileKeys.length === 0) {
            return res.status(400).json({
              error: `No files found with the specified key ${key}`
            });
          }else{
  
          // Delete files with the extracted keys
          const deleteParams = {
            Bucket: process.env.BUCKET_NAME || "",
            Delete: {
              Objects: fileKeys.map((Key) => ({ Key })),
              Quiet: false,
            },
          };
    
          const response = await s3.send(new DeleteObjectsCommand(deleteParams));
    
          // Check if any errors occurred during deletion
          if (response.Errors && response.Errors.length > 0) {
              console.log("Error deleting file from S3 bucket",response.Errors);
            return res.status(400).json({
              error: "Some errors occurred during deletion. Check the Errors array for details.",
              detailedErrors: response.Errors,
            });
          }
    
          res.json({ success: true, message: "file deleted successfully" });
      }
    
     }
      catch(err:any){
        next(err)
      }
    }