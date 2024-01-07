import { DeleteObjectsCommand, } from "@aws-sdk/client-s3";
import { s3 } from "../../config/s3Config.js";
import { listObjectsWithPrefix } from "../../IMAGES/Delete/helper/SinglePrefixObjects.js";
export const deleteVideoAndThumbnail = async (req, res, next) => {
    const userId = req.query.userId;
    const { key, } = req.body;
    // Validate userId
    if (!userId) {
        return res.status(400).json({
            error: "Missing userId. Please navigate to your profile and retrieve your userId",
        });
    }
    // Validate key or keys
    if (!key) {
        return res.status(400).json({
            error: "Missing key or invalid keys",
        });
    }
    try {
        const videoPrefix = `${userId}/videos/${key}.mp4`;
        const thumbnailPrefix = `${userId}/videos/thumbnails/${key}.jpg`;
        // List objects with the specified prefixes
        const videoKeys = await listObjectsWithPrefix(process.env.BUCKET_NAME || "", videoPrefix);
        const thumbnailKeys = await listObjectsWithPrefix(process.env.BUCKET_NAME || "", thumbnailPrefix);
        // Concatenate keys from both prefixes
        const keysToDelete = [...videoKeys, ...thumbnailKeys];
        // Check if there are any files to delete
        if (keysToDelete.length === 0) {
            return res.status(400).json({
                error: `No files found with the specified key ${key}`
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
                console.log("Error deleting video from S3 bucket", response.Errors);
                return res.status(400).json({
                    error: "Some errors occurred during deletion. Check the Errors array for details.",
                    detailedErrors: response.Errors,
                });
            }
            res.json({ success: true, message: "video and its thumbnail deleted successfully" });
        }
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=deleteVideo.js.map