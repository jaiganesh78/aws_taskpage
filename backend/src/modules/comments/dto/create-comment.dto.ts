import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Message content of the comment', maxLength: 1000, example: 'This is a comment update.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}
