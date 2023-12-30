import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../../config/s3Config.js";
import fs from 'fs';

export const uploadThumbnailToAWS = async (bucket: string, key: string, thumbnailPath: string) => {
    try {
        const thumbnailBuffer = fs.readFileSync(thumbnailPath);

      const params = {
        Bucket: bucket,
        Key: key,
        Body: thumbnailBuffer,
        GrantRead: 'uri="http://acs.amazonaws.com/groups/global/AllUsers"', // Make the image accessible to everyone
        ContentType: 'image/jpeg',  // Specify the content type based on your thumbnail format
        ContentDisposition: 'inline',  // or 'attachment' if you want to force download
      };
  
      const result = await s3.send(new PutObjectCommand(params));
  
      console.log('Thumbnail upload successful!');
      return `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`
    } catch (err: any) {
      console.error('An error occurred: ' + err.message);
    }
  };
  