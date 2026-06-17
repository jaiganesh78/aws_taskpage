import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { CrewService } from './crew.service';
import { CreateCrewDto } from './dto/create-crew.dto';
import { UpdateCrewDto } from './dto/update-crew.dto';
import { UserContextGuard } from '../../common/guards/user-context.guard';

@ApiTags('Crew')
@ApiHeader({
  name: 'x-user-id',
  description: 'Authenticated User ID header',
  required: false,
})
@UseGuards(UserContextGuard)
@Controller('crew')
export class CrewController {
  constructor(private readonly crewService: CrewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new crew member' })
  @ApiResponse({ status: 201, description: 'Crew member created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload or email already registered' })
  create(@Body() createCrewDto: CreateCrewDto) {
    return this.crewService.create(createCrewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all crew members (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'workload'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of crew members' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'workload',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.crewService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update crew member' })
  @ApiResponse({ status: 200, description: 'Crew member updated' })
  @ApiResponse({ status: 404, description: 'Crew member not found' })
  update(@Param('id') id: string, @Body() updateCrewDto: UpdateCrewDto) {
    return this.crewService.update(id, updateCrewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crew member' })
  @ApiResponse({ status: 200, description: 'Crew member removed successfully' })
  @ApiResponse({ status: 400, description: 'Crew member has active tasks and cannot be removed' })
  @ApiResponse({ status: 404, description: 'Crew member not found' })
  remove(@Param('id') id: string) {
    return this.crewService.remove(id);
  }
}
