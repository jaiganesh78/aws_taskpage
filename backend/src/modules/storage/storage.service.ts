import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string | null = null;
  private provider: 'local' | 's3' = 'local';
  private uploadsDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'tasks');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    const requestedProvider = this.configService.get<string>('app.storageProvider') || 'local';
    const awsAccessKey = this.configService.get<string>('app.awsAccessKeyId');
    const awsSecret = this.configService.get<string>('app.awsSecretAccessKey');
    const awsRegion = this.configService.get<string>('app.awsRegion') || 'us-east-1';
    const bucket = this.configService.get<string>('app.awsS3Bucket');

    if (requestedProvider === 's3' && awsAccessKey && awsSecret && bucket) {
      try {
        this.s3Client = new S3Client({
          region: awsRegion,
          credentials: {
            accessKeyId: awsAccessKey,
            secretAccessKey: awsSecret,
          },
        });
        this.bucketName = bucket;
        this.provider = 's3';
        this.logger.log(`Initialized S3 storage provider on bucket: ${bucket}`);
      } catch (err) {
        this.logger.error('Failed to initialize S3 storage. Falling back to local storage.', err);
        this.provider = 'local';
      }
    } else {
      if (requestedProvider === 's3') {
        this.logger.warn('S3 Storage requested but credentials or bucket name are missing. Falling back to local storage.');
      }
      this.provider = 'local';
      this.logger.log(`Initialized Local storage provider in: ${this.uploadsDir}`);
    }
  }

  async uploadFile(
    file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
    taskId: string,
  ): Promise<{ fileUrl: string; fileName: string; fileType: string; fileSize: number }> {
    const uuid = crypto.randomUUID();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${uuid}-${sanitizedName}`;

    if (this.provider === 's3' && this.s3Client && this.bucketName) {
      const key = `tasks/${taskId}/${fileName}`;
      const region = this.configService.get<string>('app.awsRegion') || 'us-east-1';
      
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
      return {
        fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    } else {
      // Local Storage
      const taskFolder = path.join(this.uploadsDir, taskId);
      if (!fs.existsSync(taskFolder)) {
        fs.mkdirSync(taskFolder, { recursive: true });
      }

      const filePath = path.join(taskFolder, fileName);
      fs.writeFileSync(filePath, file.buffer);

      const port = this.configService.get<number>('app.port') || 4000;
      const fileUrl = `http://localhost:${port}/api/v1/uploads/tasks/${taskId}/${fileName}`;
      
      return {
        fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    if (this.provider === 's3' && this.s3Client && this.bucketName) {
      try {
        // Extract S3 key from S3 URL
        // Example URL: https://my-bucket.s3.us-east-1.amazonaws.com/tasks/taskId/fileName
        const urlObj = new URL(fileUrl);
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
        this.logger.log(`Deleted S3 object: ${key}`);
      } catch (err) {
        this.logger.error(`Failed to delete S3 file: ${fileUrl}`, err);
      }
    } else {
      // Local Storage Deletion
      try {
        // Extract taskId and fileName from local URL
        // Example: http://localhost:4000/api/v1/uploads/tasks/taskId/fileName
        const urlObj = new URL(fileUrl);
        const parts = urlObj.pathname.split('/');
        const fileName = parts.pop();
        const taskId = parts.pop();

        if (taskId && fileName) {
          const filePath = path.join(this.uploadsDir, taskId, fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.logger.log(`Deleted local file: ${filePath}`);
          }
        }
      } catch (err) {
        this.logger.error(`Failed to delete local file for URL: ${fileUrl}`, err);
      }
    }
  }
}
