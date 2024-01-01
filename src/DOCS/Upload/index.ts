import express from 'express';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfThumbnail from 'pdf-thumbnail';
import * as mammoth from 'mammoth';
import * as pptxgen from 'pptxgenjs';
import * as ExcelJS from 'exceljs';
import * as AWS from 'aws-sdk';
import * as archiver from 'archiver';

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key',
});

app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const uploadedFiles = req.files as Express.Multer.File[];

    // Ensure at least one file is uploaded
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    let thumbnailPath: string | undefined;

    // Generate thumbnails in the specified order of priority
    for (const file of uploadedFiles) {
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === '.pdf') {
        thumbnailPath = await generateThumbnail(file, pdfThumbnail.generate);
        break;
      } else if (ext === '.docx') {
        thumbnailPath = await generateThumbnailFromDocx(file, mammoth.extractRawText);
        break;
      } else if (ext === '.pptx') {
        thumbnailPath = await generateThumbnailFromPptx(file, pptxgen);
        break;
      } else if (ext === '.xlsx') {
        thumbnailPath = await generateThumbnailFromXlsx(file, ExcelJS.Workbook);
        break;
      }
    }

    // Upload the selected thumbnail to AWS S3
    if (thumbnailPath) {
      const thumbnailUploadParams = {
        Bucket: 'your-s3-bucket',
        Key: thumbnailPath,
        Body: fs.createReadStream(thumbnailPath),
      };
      await s3.upload(thumbnailUploadParams).promise();

      // Remove the local thumbnail file after upload
      fs.unlinkSync(thumbnailPath);

      // Combine files into a ZIP archive
      const zipPath = path.join('uploads', 'combined-files.zip');
      const archive = archiver('zip', { zlib: { level: 9 } });
      const zipStream = fs.createWriteStream(zipPath);

      archive.pipe(zipStream);
      uploadedFiles.forEach((file) => {
        archive.file(file.path, { name: file.originalname });
      });
      archive.finalize();

      // Upload the ZIP file to AWS S3
      const zipUploadParams = {
        Bucket: 'your-s3-bucket',
        Key: 'combined-files.zip',
        Body: fs.createReadStream(zipPath),
      };
      await s3.upload(zipUploadParams).promise();

      // Remove the local ZIP file after upload
      fs.unlinkSync(zipPath);

      res.json({ thumbnailUrl: `https://your-s3-bucket.s3.amazonaws.com/${path.basename(thumbnailPath)}`, zipUrl: `https://your-s3-bucket.s3.amazonaws.com/combined-files.zip` });
    } else {
      res.status(400).json({ error: 'No supported file types found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function generateThumbnail(file: Express.Multer.File, generateFunction: Function): Promise<string> {
  const thumbnailPath = path.join('thumbnails', `${file.filename}-thumbnail.jpg`);
  await generateFunction(file.path, { size: 'small', output: thumbnailPath });
  return thumbnailPath;
}

async function generateThumbnailFromDocx(file: Express.Multer.File, extractFunction: Function): Promise<string> {
  const { value } = await extractFunction({ path: file.path });
  const thumbnailPath = path.join('thumbnails', `${file.filename}-thumbnail.jpg`);
  // Create a thumbnail from the extracted text (use your method for creating an image from text)
  // Replace with your actual method
  createImageFromText(value);
  return thumbnailPath;
}

async function generateThumbnailFromPptx(file: Express.Multer.File, pptxgenFunction: Function): Promise<string> {
  const pptx = pptxgenFunction();
  // Add slides or content to the presentation
  await pptx.render();
  const thumbnailPath = path.join('thumbnails', `${file.filename}-thumbnail.jpg`);
  // Create a thumbnail from the rendered presentation (use your method for creating an image from the presentation)
  // Replace with your actual method
  createImageFromPresentation(pptx);
  return thumbnailPath;
}

async function generateThumbnailFromXlsx(file: Express.Multer.File, workbookFunction: Function): Promise<string> {
  const workbook = new workbookFunction();
  await workbook.xlsx.readFile(file.path);
  // Add content to the workbook
  await workbook.xlsx.writeBuffer();
  const thumbnailPath = path.join('thumbnails', `${file.filename}-thumbnail.jpg`);
  // Create a thumbnail from the workbook (use your method for creating an image from the workbook)
  // Replace with your actual method
  createImageFromWorkbook(workbook);
  return thumbnailPath;
}

// Add your actual implementations for createImageFromText, createImageFromPresentation, createImageFromWorkbook
// ...

// Example usage:
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
