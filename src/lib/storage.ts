/**
 * S3/MinIO Storage Service
 *
 * Provides file upload, download, and delete operations
 * using S3-compatible API (works with MinIO and AWS S3).
 *
 * ISO 27001 A.12.3.1 - Information backup
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const S3_BUCKET = process.env.S3_BUCKET || 'free-crm-documents';
const S3_REGION = process.env.S3_REGION || 'us-east-1';

let s3Client: S3Client | null = null;

/**
 * Get or create S3 client singleton
 */
export function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO
  });

  return s3Client;
}

/**
 * Ensure the storage bucket exists, create if not
 */
export async function ensureBucket(): Promise<void> {
  const client = getS3Client();

  try {
    await client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
  } catch {
    // Bucket doesn't exist, create it
    await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
    console.log(`Created S3 bucket: ${S3_BUCKET}`);
  }
}

/**
 * Generate a unique file key for storage
 * Format: documents/{orgId}/{uuid}/{filename}
 */
export function generateFileKey(
  organizationId: string,
  filename: string
): string {
  const uuid = crypto.randomUUID();
  // Sanitize filename: remove path separators and special chars
  const safeName = filename.replaceAll(/[^a-zA-Z0-9._\u4e00-\u9fa5-]/g, '_');
  return `documents/${organizationId}/${uuid}/${safeName}`;
}

/**
 * Upload a file to S3/MinIO
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; size: number }> {
  const client = getS3Client();
  await ensureBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return { key, size: buffer.length };
}

/**
 * Get a presigned URL for file download (valid for 1 hour)
 */
export async function getFileUrl(key: string): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/**
 * Download a file from S3/MinIO as a Buffer
 * Used by the document text extraction pipeline.
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const client = getS3Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error(`Empty response body for key: ${key}`);
  }

  // Convert readable stream to Buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Delete a file from S3/MinIO
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}

/**
 * Get the configured bucket name
 */
export function getBucketName(): string {
  return S3_BUCKET;
}
