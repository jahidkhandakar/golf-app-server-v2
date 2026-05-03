import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import sharp from "sharp";
import {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
} from "./../config/index";

// Validate env
if (
  !AWS_REGION ||
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_BUCKET_NAME
) {
  throw new Error("AWS configuration is missing. Check .env file.");
}

// S3 client (v3) - Keep global to reuse connections
export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Memory storage is fastest for small/medium files as it avoids disk I/O
const storage = multer.memoryStorage();

const allowedTypes: string[] = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("File type not allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Sharp optimization settings
// sharp.concurrency(1); // Removed to allow multi-threading for faster processing
sharp.cache(true);

const shouldProcessWithSharp = (mimetype: string): boolean => {
  return (
    mimetype.startsWith("image/") &&
    !["image/svg+xml", "image/gif"].includes(mimetype)
  );
};

// --- Background Upload Helpers ---

export const generateFileKey = (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const key = `${uuidv4()}${ext}`;
  const url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
};

const processAndUploadBackground = async (
  file: Express.Multer.File,
  key: string,
) => {
  try {
    let finalBuffer = file.buffer;
    const finalMimeType = file.mimetype;

    // Faster Sharp processing with optimized defaults
    if (shouldProcessWithSharp(file.mimetype)) {
      try {
        const transformer = sharp(file.buffer)
          .resize(1280, 1280, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .rotate()
          .jpeg({ quality: 80, progressive: true, mozjpeg: false }) // Disable mozjpeg for speed
          .webp({ quality: 80, effort: 2 }) // Lower effort for faster processing
          .png({ compressionLevel: 6, palette: true });

        finalBuffer = await transformer.toBuffer();
      } catch (err) {
        console.warn("Sharp optimization failed, falling back:", err);
      }
    }

    // Use PutObjectCommand with optimized settings
    await s3Client.send(
      new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: key,
        Body: finalBuffer,
        ContentType: finalMimeType,
      }),
    );
    // console.log(`Background upload success: ${key}`);
  } catch (error) {
    console.error(`Background upload failed for ${key}:`, error);
  }
};

export const uploadToS3 = async (
  file: Express.Multer.File,
): Promise<string> => {
  if (!file || !file.originalname) {
    throw new Error("Invalid file or missing file name");
  }

  const { key, url } = generateFileKey(file);

  // Fire and forget - do not await
  processAndUploadBackground(file, key);

  return url;
};

export const multiUploadHandler = (
  fields: { name: string; maxCount?: number }[],
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.fields(fields)(req, res, (err: unknown) => {
      if (err) return next(err);

      if (!req.files) return next();

      const files = req.files as Record<string, Express.Multer.File[]>;
      const uploadedUrls: Record<string, string | string[]> = {};

      // Process all uploads in background
      Object.keys(files).forEach((fieldName) => {
        const fileArray = files[fieldName];
        const urls: string[] = [];

        fileArray.forEach((file) => {
          const { key, url } = generateFileKey(file);
          urls.push(url);

          // Fire and forget
          processAndUploadBackground(file, key);
        });

        uploadedUrls[fieldName] = urls.length === 1 ? urls[0] : urls;
      });

      if (Object.keys(uploadedUrls).length > 0) {
        (req.body as any).files = uploadedUrls;
      }
      next();
    });
  };
};
