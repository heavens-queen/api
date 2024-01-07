import { DeleteObjectsCommand, } from "@aws-sdk/client-s3";
import { s3 } from "../../config/s3Config.js";
import { listObjectsWithPrefix } from "./helper/SinglePrefixObjects.js";
import { listObjectsWithPrefixBatch } from "./helper/ObjectsWithPrefixBatch.js";
export async function deleteImageAndThumbnail(req, res, next) {
    const userId = req.query.userId;
    const { key, keys } = req.body;
    // Validate userId
    if (!userId) {
        return res.status(400).json({
            error: "Missing userId. Please navigate to your profile and retrieve your userId",
        });
    }
    // Validate key or keys
    if (!key && (!keys || !Array.isArray(keys))) {
        return res.status(400).json({
            error: "Missing key or invalid keys",
        });
    }
    try {
        if (key) {
            const imagePrefix = `${userId}/images/${key}`;
            const thumbnailPrefix = `${userId}/images/thumbnails/${key}`;
            // List objects with the specified prefixes
            const imageKeys = await listObjectsWithPrefix(process.env.BUCKET_NAME || "", imagePrefix);
            const thumbnailKeys = await listObjectsWithPrefix(process.env.BUCKET_NAME || "", thumbnailPrefix);
            // Concatenate keys from both prefixes
            const keysToDelete = [...imageKeys, ...thumbnailKeys];
            // Check if there are any files to delete
            if (keysToDelete.length === 0) {
                return res.status(404).json({
                    error: `No files found with the specified  key ${key}`
                });
            }
            else {
                // Delete files with the extracted keys
                const deleteParams = {
                    Bucket: process.env.BUCKET_NAME || "",
                    Delete: {
                        Objects: keysToDelete.map((Key) => ({ Key })),
                        Quiet: false,
                    },
                };
                const response = await s3.send(new DeleteObjectsCommand(deleteParams));
                // Check if any errors occurred during deletion
                if (response.Errors && response.Errors.length > 0) {
                    console.log("Error deleting images from S3 bucket", response.Errors);
                    return res.status(400).json({
                        error: "Some errors occurred during deletion. Check the Errors array for details.",
                        detailedErrors: response.Errors,
                    });
                }
                res.status(200).json({ success: true, message: "Image and its thumbnail deleted successfully" });
            }
        }
        else if (keys) {
            const Objects = keys.flatMap((key) => {
                const imagePrefix = `${userId}/images/${key}`;
                const thumbnailPrefix = `${userId}/images/thumbnails/${key}`;
                return [{ Key: imagePrefix }, { Key: thumbnailPrefix }];
            });
            // List objects with the specified prefixes
            const { imageKeysToDelete, thumbnailKeysToDelete } = await listObjectsWithPrefixBatch(process.env.BUCKET_NAME || "", Objects);
            console.log("images", imageKeysToDelete);
            console.log("thumbnails", thumbnailKeysToDelete);
            // Check if there are any files to delete
            if (imageKeysToDelete.length === 0 && thumbnailKeysToDelete.length === 0) {
                return res.status(404).json({
                    error: `No files found with the specified key ${key}`
                });
            }
            // Delete images
            if (imageKeysToDelete.length > 0) {
                const imageDeleteParams = {
                    Bucket: process.env.BUCKET_NAME || "",
                    Delete: {
                        Objects: imageKeysToDelete.map((Key) => ({ Key })),
                        Quiet: false,
                    },
                };
                const imageResponse = await s3.send(new DeleteObjectsCommand(imageDeleteParams));
                if (imageResponse.Errors && imageResponse.Errors.length > 0) {
                    return res.status(400).json({
                        error: "Some errors occurred during deletion of images. Check the Errors array for details.",
                        detailedErrors: imageResponse.Errors,
                    });
                }
            }
            // Delete thumbnails
            if (thumbnailKeysToDelete.length > 0) {
                const thumbnailDeleteParams = {
                    Bucket: process.env.BUCKET_NAME || "",
                    Delete: {
                        Objects: thumbnailKeysToDelete.map((Key) => ({ Key })),
                        Quiet: false,
                    },
                };
                const thumbnailResponse = await s3.send(new DeleteObjectsCommand(thumbnailDeleteParams));
                if (thumbnailResponse.Errors && thumbnailResponse.Errors.length > 0) {
                    return res.status(400).json({
                        error: "Some errors occurred during deletion of thumbnails. Check the Errors array for details.",
                        detailedErrors: thumbnailResponse.Errors,
                    });
                }
            }
            res.json({ success: true, message: "Images and thumbnails deleted successfully" });
        }
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=deletSpecificImages.js.map