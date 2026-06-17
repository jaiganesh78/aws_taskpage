import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsUrl, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
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
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      PORT: config.PORT ? parseInt(config.PORT, 10) : 4000,
    },
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Config validation error:\n${errors.map(err => Object.values(err.constraints || {}).join(', ')).join('\n')}`);
  }
  return validatedConfig;
}
