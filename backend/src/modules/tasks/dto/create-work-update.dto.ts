import { IsString, IsInt, Min, Max, IsArray, ValidateNested, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AttachmentDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'File URL returned from upload API' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ description: 'Mime type of the file' })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({ description: 'Size of file in bytes' })
  @IsInt()
  @Min(0)
  fileSize: number;
}

export class CreateWorkUpdateDto {
  @ApiProperty({ description: 'Description of the work done in this update' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Progress percentage (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty({ description: 'List of attachments', type: [AttachmentDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[];
}
