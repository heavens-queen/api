import { Request, Response } from 'express';
import { v4 as uuidv4 } from "uuid";
import { compressAndUploadVideo } from './helper/CompressAndUploadVida.js';

export  const UploadVedio = async  (req: Request, res: Response) => {
  try {
    if (!req?.headers['content-type']?.includes('multipart/form-data') ) {
      // Check if the request is not of type 'multipart/form-data'
      return res.status(400).json({ success: false, message: 'Invalid request format' });
    }

    const fileStream = req; 
const userId=req.query.userId;
    const s3Key = `${userId}/videos/${uuidv4}.mp4`; 

    // Compress and upload the video to S3
    await compressAndUploadVideo(fileStream, s3Key);

    // Construct the S3 URL for the compressed video
    const s3Url = `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    // Send a success response with the video URL
    res.json({ success: true, message: 'Video uploaded and compressed successfully', videoUrl: s3Url });
  } catch (error) {
    console.error('Error handling video upload:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
