import { createWriteStream, unlink } from 'fs';
import { promisify } from 'util';
import { Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import { s3 } from '../../../config/s3Config.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import {path}  from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(path);
const unlinkAsync = promisify(unlink);

export async function compressAndUploadVideo(fileStream: Readable, s3Key: string): Promise<void> {
  const tempFilePath = '//home/glen/Desktop/mediaGlens/file_Otput.mp4'; // Change this to a suitable temporary path
//   const writeStream = createWriteStream(tempFilePath);

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = ffmpeg()
      .input('/home/glen/Desktop/mediaGlens/video/y2mate.com - Central Cee x Dave  Sprinter Music Video_720p.mp4')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset veryfast', '-crf 18'])
      .toFormat('mp4')
      .on('end', async () => {
        console.log('Video processing finished');

        // Upload the processed video to S3
        const fileContent = fs.readFileSync(tempFilePath);
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME || '',
            Key: s3Key,
            Body: fileContent,
            ContentType: 'video/mp4',
          })
        );

        // Remove the temporary file
        await unlinkAsync(tempFilePath);
        resolve(); // Resolve here
      })
      .on('error', async (err, stdout, stderr) => {
        console.error('Error processing video:', err);
        console.error('ffmpeg stdout:', stdout);
        console.error('ffmpeg stderr:', stderr);

        // Remove the temporary file in case of an error
        await unlinkAsync(tempFilePath);
        reject(err); // Reject here
      })
      .save(tempFilePath);
  });
}
