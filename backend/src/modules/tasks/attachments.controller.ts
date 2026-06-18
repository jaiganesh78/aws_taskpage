import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { UserContextGuard } from '../../common/guards/user-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserDto } from '../../common/decorators/current-user.decorator';

@ApiTags('Attachments')
@ApiHeader({
  name: 'x-user-id',
  description: 'Authenticated User ID header',
  required: false,
})
@UseGuards(UserContextGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly tasksService: TasksService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work update attachment' })
  @ApiParam({ name: 'id', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'Attachment deleted successfully' })
  deleteAttachment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.tasksService.deleteAttachment(id, user.id, user.role);
  }
}
