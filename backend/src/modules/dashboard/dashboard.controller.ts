import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { UserContextGuard } from '../../common/guards/user-context.guard';

@ApiTags('Dashboard')
@ApiHeader({
  name: 'x-user-id',
  description: 'Authenticated User ID header',
  required: false,
})
@UseGuards(UserContextGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get summary analytics for tasks and crew members' })
  @ApiResponse({ status: 200, description: 'Summary statistics payload' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('task-distribution')
  @ApiOperation({ summary: 'Get task count breakdown grouped by category, priority, and status' })
  @ApiResponse({ status: 200, description: 'Task distribution statistics payload' })
  getTaskDistribution() {
    return this.dashboardService.getTaskDistribution();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get latest 20 activity log records for homepage feed' })
  @ApiResponse({ status: 200, description: 'List of activity logs' })
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('upcoming-deadlines')
  @ApiOperation({ summary: 'Get active tasks with deadlines in next 7 days' })
  @ApiResponse({ status: 200, description: 'List of upcoming deadline tasks' })
  getUpcomingDeadlines() {
    return this.dashboardService.getUpcomingDeadlines();
  }

  @Get('workloads')
  @ApiOperation({ summary: 'Get workload details and calculated status for all crew members' })
  @ApiResponse({ status: 200, description: 'List of workloads metadata' })
  getWorkloads() {
    return this.dashboardService.getWorkloads();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get detailed analytics' })
  @ApiResponse({ status: 200, description: 'Detailed lifecycle metrics payload' })
  getAnalytics() {
    return this.dashboardService.getAnalytics();
  }
}
