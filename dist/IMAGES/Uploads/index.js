import sharp from "sharp";
import { s3 } from "../../config/s3Config.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
config();
export const UploadImages = async (req, res, next) => {
    try {
        const { width, height, quality = 80, crop, progressive, grayscale, rotate, format = "original", } = req.query;
        const userId = req.query.userId;
        console.log("format", format);
        if (!userId) {
            throw new Error("userId is required");
        }
        console.log("quality", quality);
        let files = req.files;
        if (!Array.isArray(files)) {
            // If only one file is uploaded, convert it to an array for uniform processing
            files = [files];
        }
        const processedImages = await Promise.all(files.map(async (file) => {
            let sharpInstance = sharp(file.buffer);
            const fileExtension = file.originalname.split(".").pop(); // Get the file extension
            // Resize if width and/or height are provided
            if (width || height) {
                sharpInstance = sharpInstance.resize(parseInt(width), parseInt(height), { fit: sharp.fit.inside, withoutEnlargement: true });
            }
            if (crop) {
                const [left, top, width, height] = crop
                    .split(",")
                    .map((val) => parseInt(val, 10));
                // Check if all values are valid integers
                if (!isNaN(left) && !isNaN(top) && !isNaN(width) && !isNaN(height)) {
                    sharpInstance = sharpInstance.extract({ left, top, width, height });
                }
                else {
                    return res
                        .status(400)
                        .json({ error: "Invalid crop values provided" });
                }
            }
            if (grayscale) {
                sharpInstance = sharpInstance.grayscale();
            }
            if (rotate) {
                const rotationAngle = parseInt(rotate, 10);
                // Check if the parsed value is a valid integer
                if (!isNaN(rotationAngle)) {
                    sharpInstance = sharpInstance.rotate(rotationAngle);
                }
                else {
                    return res
                        .status(400)
                        .json({ error: "Invalid rotation angle provided" });
                }
            }
            // Apply compression settings
            if (progressive && format === "jpeg") {
                sharpInstance.jpeg({
                    quality: parseInt(quality),
                    progressive: true,
                });
            }
            else if (format === "webp") {
                sharpInstance.webp({ quality: parseInt(quality) });
            }
            else {
                // Default compression for other formats (or if format is not specified)
                sharpInstance.toFormat(fileExtension, {
                    quality: parseInt(quality),
                });
            }
            // Convert to the desired format or keep the original format
            if (format !== "original") {
                sharpInstance.toFormat(format);
            }
            const fileNameWithoutExtension = file.originalname
                .split(".")
                .slice(0, -1)
                .join(".");
            const formatSuffix = format !== "original" ? `${format}` : `${fileExtension}`; // Include format only if it's not 'original'
            const fileName = `${uuidv4()}-${fileNameWithoutExtension}.${formatSuffix}`;
            // Process the image and upload to S3
            const processedImageBuffer = await sharpInstance.toBuffer();
            const uploadParams = {
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
            const thumbnailParams = {
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
            const compressionApplied = ((1 - finalFileSize / OriginalFileSize) *
                100).toFixed(2); // Calculating compression as a %
            return {
                key: fileName,
                mimeType: `image/${formatSuffix}`,
                OriginalFileSize: `${OriginalFileSize.toFixed(2)} MB`, // Display 2 Dp
                finalFileSize: `${finalFileSize.toFixed(2)} MB`,
                compressionApplied: `${compressionApplied}%`,
                imageUrl: `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${userId}/images/${fileName}`,
                thumbnailUrl: `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${userId}/images/${thumbnailFileName}`,
            };
        }));
        res.json({ processedImages });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=index.js.map