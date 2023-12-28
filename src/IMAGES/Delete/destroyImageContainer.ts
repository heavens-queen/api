import { NextFunction, Request ,Response} from "express";
import { listObjectsWithPrefix } from "./helper/SinglePrefixObjects.js";
import { s3 } from "../../config/s3Config.js";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

export const deleteImagesContainer=async(req:Request,res:Response,next:NextFunction)=>{
    const userId=req.query.userId;
    try{

        if(!userId){
            throw new Error("User Id is required");
        }
        const imagePrefix = `${userId}/images/`;
  
        // List objects with the specified prefixes
        const imageKeys = await listObjectsWithPrefix(
          process.env.BUCKET_NAME || "",
          imagePrefix
        );
         
  
         // Check if there are any files to delete
         if (imageKeys.length === 0) {
           return res.status(400).json({
             error: `No files found with the specified userId : ${userId}`
           });
         }else{
 
         // Delete files with the extracted keys
         const deleteParams = {
           Bucket: process.env.BUCKET_NAME || "",
           Delete: {
             Objects: imageKeys.map((Key) => ({ Key })),
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
   
         res.json({ success: true, message: "files  deleted successfully" });
     }
    }catch(err){
        next(err);
    }

}