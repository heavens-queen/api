import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../../config/s3Config.js";
import fs from 'fs';
import { resizeThumbnailImage } from "./resizeThumnail.js";
export const uploadThumbnailToAWS = async (bucket, key, thumbnailPath) => {
    try {
        const thumbnailBuffer = fs.readFileSync(thumbnailPath);
        const thumbnailResizedBuffer = await resizeThumbnailImage(thumbnailBuffer, 640, 480);
        const params = {
            Bucket: bucket,
            Key: key,
            Body: thumbnailResizedBuffer,
            GrantRead: 'uri="http://acs.amazonaws.com/groups/global/AllUsers"', // Make the image accessible to everyone
            ContentType: 'image/jpeg', // Specify the content type based on your thumbnail format
            Metadata: {
                "Content-Disposition": "inline", // Set inline header
            },
        };
        const result = await s3.send(new PutObjectCommand(params));
        console.log('Thumbnail upload successful!');
        return `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`;
    }
    catch (err) {
        console.error('An error occurred: ' + err.message);
    }
};
//# sourceMappingURL=uploadThumnail.js.map