import { Writable } from 'stream';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import { s3 } from '../../../config/s3Config.js';

export async function compressAndUploadVideo(fileStream: Readable, s3Key: string): Promise<void> {
 
  const writableStream = new Writable();

  writableStream._write = async (chunk, encoding, callback) => {
   
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME || '',
          Key: s3Key,
          Body: chunk,
          ContentType: 'video/mp4', // Set the content type based on your video type
        })
      );
      callback();
    } catch (error) {
        callback(error as Error);
    }
  };

  return new Promise<void>((resolve, reject) => {
    // Compress and process the video using fluent-ffmpeg
    ffmpeg()
      .input(fileStream)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset veryfast', '-crf 18'])
      .toFormat('mp4')
      .on('end', () => {
        console.log('Video processing finished');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error processing video:', err);
        reject(err);
      })
      .pipe(writableStream);
  });
}
