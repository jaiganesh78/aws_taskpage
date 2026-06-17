import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCrewDto } from './dto/create-crew.dto';
import { UpdateCrewDto } from './dto/update-crew.dto';
import { CrewQuery } from './interfaces/crew-query.interface';

export interface CrewMemberWithWorkload {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  department: string | null;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  workloadStatus: 'available' | 'busy' | 'overloaded';
  createdAt: Date;
}

@Injectable()
export class CrewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCrewDto): Promise<any> {
    // Check if email already registered
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        department: dto.department || null,
        avatar: dto.avatar || null,
        role: 'crew', // Force crew role
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateCrewDto): Promise<any> {
    const crew = await this.prisma.user.findFirst({
      where: { id, role: 'crew' },
    });
    if (!crew) {
      throw new NotFoundException(`Crew member not found`);
    }

    if (dto.email && dto.email !== crew.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        department: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const crew = await this.prisma.user.findFirst({
      where: { id, role: 'crew' },
    });
    if (!crew) {
      throw new NotFoundException(`Crew member not found`);
    }

    // Check if any active tasks exist
    const activeTasksCount = await this.prisma.task.count({
      where: {
        assignedToId: id,
        status: { not: 'completed' },
        isDeleted: false,
      },
    });

    if (activeTasksCount > 0) {
      throw new BadRequestException(`Cannot delete crew member. Member has ${activeTasksCount} active tasks assigned.`);
    }

    await this.prisma.$transaction([
      this.prisma.comment.deleteMany({ where: { userId: id } }),
      this.prisma.progressUpdate.deleteMany({ where: { userId: id } }),
      this.prisma.activityLog.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  }

  async findAll(query: CrewQuery): Promise<{ data: CrewMemberWithWorkload[]; pagination: any }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 20);
    const skip = (page - 1) * limit;
    const now = new Date();

    // Setup filter
    const searchFilter = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { department: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const whereClause = {
      role: 'crew' as const,
      ...searchFilter,
    };

    // If sorting by workload, we must pull all matches, calculate status, sort, and slice
    if (query.sortBy === 'workload') {
      const allCrew = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          assignedTasks: {
            where: { isDeleted: false },
            select: {
              status: true,
              dueDate: true,
            },
          },
        },
      });

      const processedCrew: CrewMemberWithWorkload[] = allCrew.map(m => {
        const activeTasks = m.assignedTasks.filter(t => t.status !== 'completed');
        const completedTasks = m.assignedTasks.filter(t => t.status === 'completed');
        const overdueTasks = activeTasks.filter(t => t.dueDate < now);

        const activeTaskCount = activeTasks.length;
        const completedTaskCount = completedTasks.length;
        const overdueTaskCount = overdueTasks.length;

        let workloadStatus: 'available' | 'busy' | 'overloaded' = 'available';
        if (activeTaskCount > 3 || overdueTaskCount > 0) {
          workloadStatus = 'overloaded';
        } else if (activeTaskCount > 0) {
          workloadStatus = 'busy';
        }

        return {
          id: m.id,
          name: m.name,
          email: m.email,
          avatar: m.avatar,
          department: m.department,
          activeTaskCount,
          completedTaskCount,
          overdueTaskCount,
          workloadStatus,
          createdAt: m.createdAt,
        };
      });

      // Workload status weights for sorting: available = 0, busy = 1, overloaded = 2
      const statusWeight = { available: 0, busy: 1, overloaded: 2 };
      const order = query.sortOrder === 'desc' ? -1 : 1;

      processedCrew.sort((a, b) => {
        return (statusWeight[a.workloadStatus] - statusWeight[b.workloadStatus]) * order;
      });

      const total = processedCrew.length;
      const paginatedData = processedCrew.slice(skip, skip + limit);

      return {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Default sorting by DB column
    const orderByClause: any = {};
    if (query.sortBy === 'name') {
      orderByClause.name = query.sortOrder || 'asc';
    } else {
      // Default to createdAt
      orderByClause.createdAt = query.sortOrder || 'desc';
    }

    const [total, crew] = await this.prisma.$transaction([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        include: {
          assignedTasks: {
            where: { isDeleted: false },
            select: {
              status: true,
              dueDate: true,
            },
          },
        },
      }),
    ]);

    const data: CrewMemberWithWorkload[] = crew.map(m => {
      const activeTasks = m.assignedTasks.filter(t => t.status !== 'completed');
      const completedTasks = m.assignedTasks.filter(t => t.status === 'completed');
      const overdueTasks = activeTasks.filter(t => t.dueDate < now);

      const activeTaskCount = activeTasks.length;
      const completedTaskCount = completedTasks.length;
      const overdueTaskCount = overdueTasks.length;

      let workloadStatus: 'available' | 'busy' | 'overloaded' = 'available';
      if (activeTaskCount > 3 || overdueTaskCount > 0) {
        workloadStatus = 'overloaded';
      } else if (activeTaskCount > 0) {
        workloadStatus = 'busy';
      }

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        department: m.department,
        activeTaskCount,
        completedTaskCount,
        overdueTaskCount,
        workloadStatus,
        createdAt: m.createdAt,
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
