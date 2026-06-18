import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { UserContextGuard } from '../../common/guards/user-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserDto } from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@ApiHeader({
  name: 'x-user-id',
  description: 'Authenticated User ID header',
  required: false,
})
@UseGuards(UserContextGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get active review queue (Core only)' })
  @ApiResponse({ status: 200, description: 'Review queue matching SLA' })
  getReviewQueue(@CurrentUser() user: CurrentUserDto) {
    return this.tasksService.getReviewQueue(user);
  }
}
