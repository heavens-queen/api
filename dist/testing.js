import ffmpeg from 'fluent-ffmpeg';
import { path } from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(path);
export const testing = () => {
    const inputVideoPath = '//home/glen/Desktop/mediaGlens/video/y2mate.com - Central Cee x Dave  Sprinter Music Video_720p.mp4';
    const outputVideoPath = '//home/glen/Desktop/mediaGlens/file_Otput.mp4';
    const targetResolution = '640:-1';
    return new Promise((resolve, reject) => {
        ffmpeg(inputVideoPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
            '-preset veryfast',
            '-crf 23',
            '-vf', `scale=${targetResolution}`,
        ])
            .toFormat('mp4')
            .save(outputVideoPath)
            .on('end', () => {
            console.log(`Video compressed successfully: ${outputVideoPath}`);
            resolve();
        })
            .on('error', (err) => {
            console.error(`Error compressing video: ${err.message}`);
            reject(err);
        });
    });
};
//# sourceMappingURL=testing.js.map