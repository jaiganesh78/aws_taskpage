import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  taskArchiveHours: parseInt(process.env.TASK_ARCHIVE_HOURS || '48', 10),
  taskDeleteDays: parseInt(process.env.TASK_DELETE_DAYS || '20', 10),
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsS3Bucket: process.env.AWS_S3_BUCKET,
}));
