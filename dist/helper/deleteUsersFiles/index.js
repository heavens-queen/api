import { DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { listObjectsWithPrefix } from "../../IMAGES/Delete/helper/SinglePrefixObjects.js";
import { s3 } from "../../config/s3Config.js";
export const deleteUsersFiles = async (req, res, next) => {
    const userId = req.query.userId;
    try {
        if (!userId) {
            throw new Error("User Id is required");
        }
        const filesPrefix = `${userId}/`;
        // List objects with the specified prefixes
        const imageKeys = await listObjectsWithPrefix(process.env.BUCKET_NAME || "", filesPrefix);
        // Check if there are any files to delete
        if (imageKeys.length === 0) {
            return res.status(400).json({
                error: `No files found with the specified userId : ${userId}`,
            });
        }
        else {
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
                console.log("Error deleting images from S3 bucket", response.Errors);
                return res.status(400).json({
                    error: "Some errors occurred during deletion. Check the Errors array for details.",
                    detailedErrors: response.Errors,
                });
            }
            // Delete the empty folder itself
            const deleteFolderParams = {
                Bucket: process.env.BUCKET_NAME || "",
                Key: filesPrefix,
            };
            await s3.send(new DeleteObjectCommand(deleteFolderParams));
            res.json({ success: true, message: "Files and folder deleted successfully" });
        }
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=index.js.map