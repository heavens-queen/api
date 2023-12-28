import { ListObjectsCommand, ObjectIdentifier } from "@aws-sdk/client-s3";
import { s3 } from "../../../config/s3Config.js";

export async function listObjectsWithPrefixBatch(bucket: string, objects: ObjectIdentifier[]) {
  const imageKeysToDelete: string[] = [];
  const thumbnailKeysToDelete: string[] = [];

  for (const obj of objects) {
    const prefix = obj.Key || '';

    const listParams = {
      Bucket: bucket,
      Prefix: prefix,
    };

    const response = await s3.send(new ListObjectsCommand(listParams));

    if (response.Contents) {
      // Extract keys from the listed objects, filtering out undefined values
      const keys: (string | undefined)[] = response.Contents.map((obj) => obj.Key);

      // Filter out undefined values and convert the array to strings
      const filteredKeys: string[] = keys.filter((key): key is string => key !== undefined);

      if (prefix.includes("thumbnails")) {
        thumbnailKeysToDelete.push(...filteredKeys);
      } else {
        imageKeysToDelete.push(...filteredKeys);
      }
    }
  }

  return { imageKeysToDelete, thumbnailKeysToDelete };
}
