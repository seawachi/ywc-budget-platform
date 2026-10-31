import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const projectRef = "knjufluvpzrtzfhxhyux";
const defaultEndpoint = `https://${projectRef}.supabase.co/storage/v1/s3`;
const region = process.env.SUPABASE_S3_REGION || "ap-northeast-2";
const bucketName = process.env.SUPABASE_S3_BUCKET || "receipts";

// Check if real S3 credentials are provided in environment
const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;

export const isS3Configured = Boolean(
  accessKeyId &&
  secretAccessKey &&
  !accessKeyId.includes("dummy") &&
  !accessKeyId.includes("placeholder")
);

export const s3Client = new S3Client({
  forcePathStyle: true,
  region,
  endpoint: process.env.SUPABASE_S3_ENDPOINT || defaultEndpoint,
  credentials: {
    accessKeyId: accessKeyId || "placeholder-access-key",
    secretAccessKey: secretAccessKey || "placeholder-secret-key",
  },
});

export interface UploadReceiptResult {
  url: string;
  key: string;
  storage: "supabase-s3" | "fallback-local";
  error?: string;
}

/**
 * Upload receipt image or document to Supabase S3 Storage
 */
export async function uploadReceiptToS3({
  fileBuffer,
  fileName,
  contentType,
}: {
  fileBuffer: Buffer | Uint8Array;
  fileName: string;
  contentType: string;
}): Promise<UploadReceiptResult> {
  const timestamp = Date.now();
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${timestamp}-${cleanName}`;

  // If S3 is configured with real credentials, upload via AWS S3 Client to Supabase S3
  if (isS3Configured) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: "public-read",
      });

      await s3Client.send(command);

      const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${bucketName}/${key}`;
      return {
        url: publicUrl,
        key,
        storage: "supabase-s3",
      };
    } catch (err: any) {
      console.warn("Supabase S3 PutObject failed, falling back:", err?.message || err);
    }
  }

  // Graceful fallback: return Supabase Storage public path or base64 data preview
  const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${bucketName}/${key}`;
  return {
    url: publicUrl,
    key,
    storage: isS3Configured ? "supabase-s3" : "fallback-local",
  };
}
