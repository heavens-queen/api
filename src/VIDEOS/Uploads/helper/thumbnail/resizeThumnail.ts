import sharp from 'sharp';

export const resizeThumbnailImage = async (inputBuffer:Buffer, width:number, height:number) => {
  try {
    const resizedBuffer = await sharp(inputBuffer)
      .resize(width, height,   { fit: sharp.fit.inside, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true }) 
      .toBuffer();

    return resizedBuffer;
  } catch (error:any) {
    console.error('Error resizing image:', error.message);
    throw error;
  }
};