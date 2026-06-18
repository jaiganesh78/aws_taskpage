import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsUrl, IsOptional, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum StorageProvider {
  Local = 'local',
  S3 = 's3',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 4000;

  @IsUrl({ protocols: ['postgresql'], require_tld: false })
  DATABASE_URL: string;

  @IsString()
  FRONTEND_URL: string;

  @IsNumber()
  @IsOptional()
  TASK_ARCHIVE_HOURS: number = 48;

  @IsNumber()
  @IsOptional()
  TASK_DELETE_DAYS: number = 30;

  @IsEnum(StorageProvider)
  @IsOptional()
  STORAGE_PROVIDER: StorageProvider = StorageProvider.Local;

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsOptional()
  AWS_REGION: string = 'us-east-1';

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      PORT: config.PORT ? parseInt(config.PORT, 10) : 4000,
      TASK_ARCHIVE_HOURS: config.TASK_ARCHIVE_HOURS ? parseInt(config.TASK_ARCHIVE_HOURS, 10) : 48,
      TASK_DELETE_DAYS: config.TASK_DELETE_DAYS ? parseInt(config.TASK_DELETE_DAYS, 10) : 30,
    },
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Config validation error:\n${errors.map(err => Object.values(err.constraints || {}).join(', ')).join('\n')}`);
  }
  return validatedConfig;
}
