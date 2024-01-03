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
    } = req.query;

    const userId = req.query.userId;
    console.log("format", format);
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
            parseInt(width as string),
            parseInt(height as string),
            { fit: sharp.fit.inside, withoutEnlargement: true }
          );
        }

        if (crop) {
          const [left, top, width, height] = (crop as string)
            .split(",")
            .map((val: string) => parseInt(val, 10));

          // Check if all values are valid integers
          if (!isNaN(left) && !isNaN(top) && !isNaN(width) && !isNaN(height)) {
            sharpInstance = sharpInstance.extract({ left, top, width, height });
          } else {
            return res
              .status(400)
              .json({ error: "Invalid crop values provided" });
          }
        }

        if (grayscale) {
          sharpInstance = sharpInstance.grayscale();
        }

        if (rotate) {
          const rotationAngle = parseInt(rotate as string, 10);

          // Check if the parsed value is a valid integer
          if (!isNaN(rotationAngle)) {
            sharpInstance = sharpInstance.rotate(rotationAngle);
          } else {
            return res
              .status(400)
              .json({ error: "Invalid rotation angle provided" });
          }
        }

        // Apply compression settings
        if (progressive && format === "jpeg") {
          sharpInstance.jpeg({
            quality: parseInt(quality as string),
            progressive: true,
          });
        } else if (format === "webp") {
          sharpInstance.webp({ quality: parseInt(quality as string) });
        } else {
          // Default compression for other formats (or if format is not specified)
          sharpInstance.toFormat(fileExtension as keyof sharp.FormatEnum, {
            quality: parseInt(quality as string),
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
          format !== "original" ? `${format}` : `${fileExtension}`; // Include format only if it's not 'original'

        const fileName = `${uuidv4()}-${fileNameWithoutExtension}.${formatSuffix}`;
        // Process the image and upload to S3
        const processedImageBuffer = await sharpInstance.toBuffer();

        const uploadParams: PutObjectCommandInput = {
          Bucket: process.env.BUCKET_NAME || "", // Use the user's ID as a subfolder
          Key: `${userId}/images/${fileName}`,
          Body: processedImageBuffer,
          ContentType: `image/${formatSuffix}`,
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
          ContentType: `image/${formatSuffix}`,
          Metadata: {
            "Content-Disposition": "inline", // Seting  inline header
          },
        };

        await s3.send(new PutObjectCommand(thumbnailParams));

        const OriginalFileSize = file.buffer.length / (1024 * 1024); // Convert bytes to megabytes
        const finalFileSize = processedImageBuffer.length / (1024 * 1024);
        const compressionApplied = (
          (1 - finalFileSize / OriginalFileSize) *
          100
        ).toFixed(2); // Calculating compression as a %

        return {
          key: fileName,
          mimeType: `image/${formatSuffix}`,
          OriginalFileSize: `${OriginalFileSize.toFixed(2)} MB`, // Display 2 Dp
          finalFileSize: `${finalFileSize.toFixed(2)} MB`,
          compressionApplied: `${compressionApplied}%`,
          imageUrl: `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${userId}/images/${fileName}`,
          thumbnailUrl: `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${userId}/images/${thumbnailFileName}`,
        };
      })
    );

    res.json({ processedImages });
  } catch (error) {
    next(error);
  }
};
