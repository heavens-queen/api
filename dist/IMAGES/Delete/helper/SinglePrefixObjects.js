import { ListObjectsCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../config/s3Config.js";
// Helper function to list objects with a specific prefix
export async function listObjectsWithPrefix(bucket, prefix) {
    const listParams = {
        Bucket: bucket,
        Prefix: prefix,
    };
    const response = await s3.send(new ListObjectsCommand(listParams));
    console.log("single listings", response);
    if (response.Contents) {
        // Extract keys from the listed objects
        const keys = response.Contents.map((obj) => obj.Key);
        return keys;
    }
    return [];
}
//# sourceMappingURL=SinglePrefixObjects.js.map