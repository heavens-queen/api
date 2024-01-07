import sharp from 'sharp';
export const resizeThumbnailImage = async (inputBuffer, width, height) => {
    try {
        const resizedBuffer = await sharp(inputBuffer)
            .resize(width, height, { fit: sharp.fit.inside, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
        return resizedBuffer;
    }
    catch (error) {
        console.error('Error resizing image:', error.message);
        throw error;
    }
};
//# sourceMappingURL=resizeThumnail.js.map