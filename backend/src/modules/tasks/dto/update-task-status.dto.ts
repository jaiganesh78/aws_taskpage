import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @ApiProperty({ description: 'New status for the task', enum: TaskStatus, example: 'blocked' })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;
}
