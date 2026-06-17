import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskProgressDto } from './dto/update-task-progress.dto';
import { UserContextGuard } from '../../common/guards/user-context.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserDto } from '../../common/decorators/current-user.decorator';
import { Category, Priority, TaskStatus } from '@prisma/client';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

@ApiTags('Tasks')
@ApiHeader({
  name: 'x-user-id',
  description: 'Authenticated User ID header',
  required: false,
})
@UseGuards(UserContextGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task (Core Team)' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid input parameters' })
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: CurrentUserDto) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with pagination, filtering, and sorting' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'category', required: false, enum: Category })
  @ApiQuery({ name: 'assigneeId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['dueDate', 'priority', 'createdAt', 'updatedAt', 'status'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of tasks matching query' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: Priority,
    @Query('category') category?: Category,
    @Query('assigneeId') assigneeId?: string,
    @Query('sortBy') sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'status',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tasksService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
      priority,
      category,
      assigneeId,
      sortBy,
      sortOrder,
    });
  }

  @Get('me/tasks')
  @ApiOperation({ summary: 'Get tasks assigned to the currently authenticated user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'category', required: false, enum: Category })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['dueDate', 'priority', 'createdAt', 'updatedAt', 'status'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of tasks assigned to current user' })
  findMeTasks(
    @CurrentUser() user: CurrentUserDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: Priority,
    @Query('category') category?: Category,
    @Query('sortBy') sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'status',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tasksService.findMeTasks(user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
      priority,
      category,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single task details by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found or has been soft deleted' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get aggregate task workspace (task, comments, progress logs, and history)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Aggregated task workspace payload' })
  @ApiResponse({ status: 404, description: 'Task not found or has been soft deleted' })
  findDetails(@Param('id') id: string) {
    return this.tasksService.findDetails(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'General update of a task (Core Team)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @CurrentUser() user: CurrentUserDto) {
    return this.tasksService.update(id, updateTaskDto, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Fast update status of a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  updateStatus(@Param('id') id: string, @Body() updateTaskStatusDto: UpdateTaskStatusDto, @CurrentUser() user: CurrentUserDto) {
    return this.tasksService.updateStatus(id, updateTaskStatusDto, user.id);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Log a progress percentage update and optional comment' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task progress logged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid progress boundary percentage (must be 0-100)' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  updateProgress(@Param('id') id: string, @Body() updateTaskProgressDto: UpdateTaskProgressDto, @CurrentUser() user: CurrentUserDto) {
    return this.tasksService.updateProgress(id, updateTaskProgressDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserDto) {
    return this.tasksService.remove(id, user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a new comment to a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.tasksService.addComment(id, createCommentDto.message, user.id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get paginated comments for a task (newest first)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of comments' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  getComments(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tasksService.getComments(id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id/progress-history')
  @ApiOperation({ summary: 'Get progress updates history for a task (newest first)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'List of progress updates' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  getProgressHistory(@Param('id') id: string) {
    return this.tasksService.getProgressHistory(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get activity timeline history for a task (newest first)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'List of activities' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  getActivityTimeline(@Param('id') id: string) {
    return this.tasksService.getActivityTimeline(id);
  }
}
