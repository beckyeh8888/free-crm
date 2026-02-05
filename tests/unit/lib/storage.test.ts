/**
 * Storage Service Tests
 * Unit tests for S3/MinIO storage operations
 *
 * @vitest-environment node
 */

// vitest globals are available via globals: true in vitest.config.ts

// Mock AWS SDK before importing storage module
const mockSend = vi.fn();
const mockGetSignedUrl = vi.fn();

// Create proper class mocks for S3Client and commands
class MockS3Client {
  send = mockSend;
}

class MockPutObjectCommand {
  type = 'PutObject';
  params: unknown;
  constructor(params: unknown) {
    this.params = params;
  }
}

class MockDeleteObjectCommand {
  type = 'DeleteObject';
  params: unknown;
  constructor(params: unknown) {
    this.params = params;
  }
}

class MockHeadBucketCommand {
  type = 'HeadBucket';
  params: unknown;
  constructor(params: unknown) {
    this.params = params;
  }
}

class MockCreateBucketCommand {
  type = 'CreateBucket';
  params: unknown;
  constructor(params: unknown) {
    this.params = params;
  }
}

class MockGetObjectCommand {
  type = 'GetObject';
  params: unknown;
  constructor(params: unknown) {
    this.params = params;
  }
}

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  PutObjectCommand: MockPutObjectCommand,
  DeleteObjectCommand: MockDeleteObjectCommand,
  HeadBucketCommand: MockHeadBucketCommand,
  CreateBucketCommand: MockCreateBucketCommand,
  GetObjectCommand: MockGetObjectCommand,
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// Mock crypto.randomUUID
const mockUUID = '12345678-1234-1234-1234-123456789012';
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID,
});

describe('Storage Service', () => {
  let storage: typeof import('@/lib/storage');

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset module to get fresh S3 client
    vi.resetModules();
    storage = await import('@/lib/storage');
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getS3Client', () => {
    it('returns S3 client instance', () => {
      const client = storage.getS3Client();
      expect(client).toBeDefined();
    });

    it('returns same instance on multiple calls (singleton)', () => {
      const client1 = storage.getS3Client();
      const client2 = storage.getS3Client();
      expect(client1).toBe(client2);
    });
  });

  describe('getBucketName', () => {
    it('returns bucket name from env or default', () => {
      const bucketName = storage.getBucketName();
      expect(bucketName).toBeTruthy();
      expect(typeof bucketName).toBe('string');
    });
  });

  describe('generateFileKey', () => {
    it('generates key with organization ID', () => {
      const key = storage.generateFileKey('org-123', 'test.pdf');
      expect(key).toContain('org-123');
    });

    it('generates key with UUID', () => {
      const key = storage.generateFileKey('org-123', 'test.pdf');
      expect(key).toContain(mockUUID);
    });

    it('generates key with filename', () => {
      const key = storage.generateFileKey('org-123', 'test.pdf');
      expect(key).toContain('test.pdf');
    });

    it('follows expected path format', () => {
      const key = storage.generateFileKey('org-123', 'document.pdf');
      expect(key).toMatch(/^documents\/org-123\/[\w-]+\/document\.pdf$/);
    });

    it('sanitizes filename with special characters', () => {
      const key = storage.generateFileKey('org-123', 'file/with\\special:chars?.txt');
      expect(key).not.toContain('/with');
      expect(key).not.toContain('\\special');
      expect(key).not.toContain(':');
      expect(key).not.toContain('?');
    });

    it('preserves Chinese characters in filename', () => {
      const key = storage.generateFileKey('org-123', '測試文件.pdf');
      expect(key).toContain('測試文件.pdf');
    });

    it('preserves allowed characters', () => {
      const key = storage.generateFileKey('org-123', 'file_name-v1.0.txt');
      expect(key).toContain('file_name-v1.0.txt');
    });
  });

  describe('ensureBucket', () => {
    it('checks if bucket exists', async () => {
      mockSend.mockResolvedValueOnce({}); // HeadBucket success

      await storage.ensureBucket();

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0]).toHaveProperty('type', 'HeadBucket');
    });

    it('creates bucket if not exists', async () => {
      mockSend.mockRejectedValueOnce(new Error('Bucket not found')); // HeadBucket fails
      mockSend.mockResolvedValueOnce({}); // CreateBucket success

      await storage.ensureBucket();

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[1][0]).toHaveProperty('type', 'CreateBucket');
    });
  });

  describe('uploadFile', () => {
    it('uploads file to S3', async () => {
      mockSend.mockResolvedValueOnce({}); // HeadBucket
      mockSend.mockResolvedValueOnce({}); // PutObject

      const buffer = Buffer.from('test content');
      const result = await storage.uploadFile('test/key', buffer, 'text/plain');

      expect(result.key).toBe('test/key');
      expect(result.size).toBe(buffer.length);
    });

    it('calls PutObjectCommand with correct params', async () => {
      mockSend.mockResolvedValueOnce({}); // HeadBucket
      mockSend.mockResolvedValueOnce({}); // PutObject

      const buffer = Buffer.from('file content');
      await storage.uploadFile('org/file.pdf', buffer, 'application/pdf');

      const putCall = mockSend.mock.calls.find(
        call => call[0]?.type === 'PutObject'
      );
      expect(putCall).toBeDefined();
      expect(putCall?.[0].params.Key).toBe('org/file.pdf');
      expect(putCall?.[0].params.ContentType).toBe('application/pdf');
    });

    it('ensures bucket before upload', async () => {
      mockSend.mockResolvedValueOnce({}); // HeadBucket
      mockSend.mockResolvedValueOnce({}); // PutObject

      const buffer = Buffer.from('test');
      await storage.uploadFile('key', buffer, 'text/plain');

      // First call should be HeadBucket (from ensureBucket)
      expect(mockSend.mock.calls[0][0]).toHaveProperty('type', 'HeadBucket');
    });
  });

  describe('getFileUrl', () => {
    it('returns presigned URL', async () => {
      const mockUrl = 'https://s3.example.com/signed-url';
      mockGetSignedUrl.mockResolvedValueOnce(mockUrl);

      const url = await storage.getFileUrl('test/key');

      expect(url).toBe(mockUrl);
    });

    it('calls getSignedUrl with correct command', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await storage.getFileUrl('documents/org-123/file.pdf');

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'GetObject',
          params: expect.objectContaining({
            Key: 'documents/org-123/file.pdf',
          }),
        }),
        expect.objectContaining({ expiresIn: 3600 })
      );
    });

    it('sets 1 hour expiration', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await storage.getFileUrl('key');

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 }
      );
    });
  });

  describe('deleteFile', () => {
    it('deletes file from S3', async () => {
      mockSend.mockResolvedValueOnce({});

      await storage.deleteFile('test/key');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0]).toHaveProperty('type', 'DeleteObject');
    });

    it('calls DeleteObjectCommand with correct key', async () => {
      mockSend.mockResolvedValueOnce({});

      await storage.deleteFile('documents/org-123/uuid/file.pdf');

      expect(mockSend.mock.calls[0][0].params.Key).toBe('documents/org-123/uuid/file.pdf');
    });

    it('throws on S3 error', async () => {
      mockSend.mockRejectedValueOnce(new Error('S3 error'));

      await expect(storage.deleteFile('key')).rejects.toThrow('S3 error');
    });
  });
});
