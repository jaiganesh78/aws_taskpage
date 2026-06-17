import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCrewDto {
  @ApiProperty({ description: 'Name of the crew member', example: 'Harini S' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email address of the crew member', example: 'harini@awssbgrec.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Department or division of the crew member', example: 'Social Media', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: 'Avatar URL of the crew member', example: 'https://avatar.url', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}
