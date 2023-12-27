import express, { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import multer from 'multer';
import { S3Client, PutObjectCommandInput, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: 'YOUR_AWS_REGION',
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
  },
});

const app = express();
const port = 3000;



export const UploadImages= async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId, // Assume you receive a user ID in the request body
      width,
      height,
      quality = 80,
      crop,
      progressive,
      grayscale,
      rotate,
      format = 'original',
    } = req.body;

    let files = req.files as Express.Multer.File[];
    if (!Array.isArray(files)) {
      // If only one file is uploaded, convert it to an array for uniform processing
      files = [files];
    }

    const processedImages = await Promise.all(
      files.map(async (file) => {
        const imageId = uuidv4(); // Generate a unique ID for each image

        let sharpInstance = sharp(file.buffer);

        // Resize if width and/or height are provided
        if (width || height) {
          sharpInstance = sharpInstance.resize(parseInt(width), parseInt(height));
        } else {
          // If no resize, apply compression with user-specified or default quality
          sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) });
        }

        // Crop if crop parameter is provided
        if (crop) {
          const [left, top, width, height] = crop.split(',').map((val: string) => parseInt(val));
          sharpInstance = sharpInstance.extract({ left, top, width, height });
        }

        // Apply other user preferences
        if (progressive && format === 'jpeg') {
          sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality), progressive: true });
        }

        if (grayscale) {
          sharpInstance = sharpInstance.grayscale();
        }

        if (rotate) {
          sharpInstance = sharpInstance.rotate(parseInt(rotate));
        }

        // Convert to the desired format or keep the original format
        if (format !== 'original') {
          sharpInstance = sharpInstance.toFormat(format as keyof sharp.FormatEnum);
        }

        // Process the image and upload to S3
        const processedImageBuffer = await sharpInstance.toBuffer();
        const uploadParams: PutObjectCommandInput = {
          Bucket: `YOUR_S3_BUCKET_NAME/${userId}`, // Use the user's ID as a subfolder
          Key: `images/${imageId}.${format}`, // Use the generated ID as the image filename
          Body: processedImageBuffer,
        };

        await s3.send(new PutObjectCommand(uploadParams));

        // Create and upload a thumbnail
        const thumbnailBuffer = await sharpInstance.resize(100, 100).toBuffer();
        const thumbnailParams: PutObjectCommandInput = {
          Bucket: `YOUR_S3_BUCKET_NAME/${userId}`, // Use the user's ID as a subfolder
          Key: `thumbnails/${imageId}.${format}`, // Use the generated ID as the thumbnail filename
          Body: thumbnailBuffer,
        };

        await s3.send(new PutObjectCommand(thumbnailParams));

        return {
          imageId,
          originalName: file.originalname,
          imageUrl: `YOUR_S3_BUCKET_URL/${userId}/images/${imageId}.${format}`,
          thumbnailUrl: `YOUR_S3_BUCKET_URL/${userId}/thumbnails/${imageId}.${format}`,
        };
      })
    );

    res.json({ processedImages });
  } catch (error) {
    next(error);
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
