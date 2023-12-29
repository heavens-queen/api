import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import { s3 } from "../../config/s3Config.js";
import { PutObjectCommandInput, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
config();

export const UploadImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      width,
      height,
      quality = 80,
      crop,
      progressive,
      grayscale,
      rotate,
      format = "original",
    } = req.body;

    const userId = req.query.userId;
    if (!userId) {
      throw new Error("userId is required");
    }
    console.log("quality", quality);
    let files = req.files as Express.Multer.File[];
    if (!Array.isArray(files)) {
      // If only one file is uploaded, convert it to an array for uniform processing
      files = [files];
    }

    const processedImages = await Promise.all(
      files.map(async (file) => {
        let sharpInstance = sharp(file.buffer);
        const fileExtension = file.originalname.split(".").pop(); // Get the file extension
        // Resize if width and/or height are provided
        if (width || height) {
          sharpInstance = sharpInstance.resize(
            parseInt(width),
            parseInt(height),
            { fit: sharp.fit.inside, withoutEnlargement: true }
          );
        }

        // Crop if crop parameter is provided
        if (crop) {
          const [left, top, width, height] = crop
            .split(",")
            .map((val: string) => parseInt(val));
          sharpInstance = sharpInstance.extract({ left, top, width, height });
        }

        if (grayscale) {
          sharpInstance = sharpInstance.grayscale();
        }

        if (rotate) {
          sharpInstance = sharpInstance.rotate(parseInt(rotate));
        }
        // Apply compression settings

        // Apply compression settings
        if (progressive && format === "jpeg") {
          sharpInstance.jpeg({ quality: parseInt(quality), progressive: true });
        } else if (format === "webp") {
          sharpInstance.webp({ quality: parseInt(quality) });
        } else {
          // Default compression for other formats (or if format is not specified)
          sharpInstance.toFormat(fileExtension as keyof sharp.FormatEnum, {
            quality: parseInt(quality),
          });
        }

        // Convert to the desired format or keep the original format
        if (format !== "original") {
          sharpInstance.toFormat(format as keyof sharp.FormatEnum);
        }

        const fileNameWithoutExtension = file.originalname
          .split(".")
          .slice(0, -1)
          .join(".");

        const formatSuffix =
          format !== "original" ? `.${format}` : `.${fileExtension}`; // Include format only if it's not 'original'

        const fileName = `${uuidv4()}-${fileNameWithoutExtension}${formatSuffix}`;
        // Process the image and upload to S3
        const processedImageBuffer = await sharpInstance.toBuffer();

        const uploadParams: PutObjectCommandInput = {
          Bucket: process.env.BUCKET_NAME || "", // Use the user's ID as a subfolder
          Key: `${userId}/images/${fileName}`,
          Body: processedImageBuffer,
          ContentType: file.mimetype,
          Metadata: {
            "Content-Disposition": "inline", // Set inline header
          },
        };

        await s3.send(new PutObjectCommand(uploadParams));

        // Create and upload a thumbnail
        const thumbnailBuffer = await sharpInstance
          .resize(100, 100, { fit: sharp.fit.inside, withoutEnlargement: true })
          .toBuffer();
        const thumbnailFileName = `thumbnails/${fileName}`; // Include format suffix in the thumbnail key
        const thumbnailParams: PutObjectCommandInput = {
          Bucket: process.env.BUCKET_NAME || "", // Use the user's ID as a subfolder
          Key: `${userId}/images/${thumbnailFileName}`, // Use the generated ID as the thumbnail filename
          Body: thumbnailBuffer,
          ContentType: file.mimetype,
          Metadata: {
            "Content-Disposition": "inline", // Set inline header
          },
        };

        await s3.send(new PutObjectCommand(thumbnailParams));

        const metadata = await sharpInstance.metadata();

        // Access metadata properties
        const mimeType = metadata.format; // MIME type
        const W = metadata.width; // Image width
        const H = metadata.height; // Image height
        const OriginalFileSize = file.buffer.length / (1024 * 1024); // Convert bytes to megabytes
        const finalFileSize = processedImageBuffer.length / (1024 * 1024); // Convert bytes to megabytes
        const compressionApplied = (
          (1 - finalFileSize / OriginalFileSize) *
          100
        ).toFixed(2); // Calculate compression as a percentage

        return {
          key: fileName,
          mimeType,
          width: W,
          height: H,
          OriginalFileSize: `${OriginalFileSize.toFixed(2)} MB`, // Display two decimal places
          finalFileSize: `${finalFileSize.toFixed(2)} MB`, // Display two decimal places
          compressionApplied: `${compressionApplied}%`,
          imageUrl: `http://${process.env.BUCKET_NAME}.s3.amazonaws.com/${userId}/images/${fileName}`,
          thumbnailUrl: `http://${process.env.BUCKET_NAME}.s3.amazonaws.com/${userId}/images/${thumbnailFileName}`,
        };
      })
    );

    res.json({ processedImages });
  } catch (error) {
    next(error);
  }
};
