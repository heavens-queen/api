import { S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
config();

const awsRegion = process.env.REGION;
const accessKey = process.env.ACCESS_KEY;
const secretKey = process.env.SECRET_KEY;

if (!awsRegion || !accessKey || !secretKey) {
  throw new Error("AWS region, access key, and secret key are required");
}

export const s3 = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});