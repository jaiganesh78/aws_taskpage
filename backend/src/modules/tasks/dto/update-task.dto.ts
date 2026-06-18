import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ description: 'ID of the assigned reviewer', required: false, example: 'core_admin' })
  @IsString()
  @IsOptional()
  reviewAssignedToId?: string;
}
