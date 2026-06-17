import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskProgressDto {
  @ApiProperty({ description: 'New progress percentage (0-100)', minimum: 0, maximum: 100, example: 50 })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty({ description: 'Optional log message or comment explaining progress', maxLength: 1000, required: false, example: 'Finished layout' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}
