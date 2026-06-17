import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Category, Priority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ description: 'Name of the task', maxLength: 100, example: 'Instagram Content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Event category', enum: Category, example: 'pre_event' })
  @IsEnum(Category)
  @IsNotEmpty()
  category: Category;

  @ApiProperty({ description: 'Priority level', enum: Priority, example: 'high' })
  @IsEnum(Priority)
  @IsNotEmpty()
  priority: Priority;

  @ApiProperty({ description: 'ID of the assigned crew user', required: false, example: 'c5' })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({ description: 'Start date of the task', required: false, example: '2026-06-16T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'Due date of the task', example: '2026-06-19T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ description: 'Task notes or descriptions', maxLength: 2000, required: false, example: 'Post stories every 4 hours' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
