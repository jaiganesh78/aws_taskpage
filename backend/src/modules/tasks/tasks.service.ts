import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskProgressDto } from './dto/update-task-progress.dto';
import { TaskQuery } from './interfaces/task-query.interface';
import { TaskStatus, ActivityAction } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto, userId: string) {
    if (dto.assignedToId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      });
      if (!targetUser || !targetUser.isActive || targetUser.role !== 'crew') {
        throw new BadRequestException('Tasks can only be assigned to active crew members.');
      }
    }

    const task = await this.prisma.$transaction(async (tx) => {
      // 1. Determine default status based on assignment
      const status = dto.assignedToId ? TaskStatus.assigned : TaskStatus.not_assigned;

      // 2. Create the task
      const newTask = await tx.task.create({
        data: {
          name: dto.name,
          category: dto.category,
          priority: dto.priority,
          status,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          dueDate: new Date(dto.dueDate),
          notes: dto.notes || null,
          createdById: userId,
          assignedToId: dto.assignedToId || null,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
        },
      });

      // 3. Log task creation
      await tx.activityLog.create({
        data: {
          taskId: newTask.id,
          userId,
          action: ActivityAction.created,
        },
      });

      // 4. Log task assignment if applicable
      if (dto.assignedToId) {
        await tx.activityLog.create({
          data: {
            taskId: newTask.id,
            userId,
            action: ActivityAction.assigned,
            metadata: { newAssigneeId: dto.assignedToId },
          },
        });
      }

      return newTask;
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    if (dto.assignedToId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      });
      if (!targetUser || !targetUser.isActive || targetUser.role !== 'crew') {
        throw new BadRequestException('Tasks can only be assigned to active crew members.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id, isDeleted: false },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.category !== undefined) updateData.category = dto.category;
      if (dto.priority !== undefined) updateData.priority = dto.priority;
      if (dto.notes !== undefined) updateData.notes = dto.notes;
      if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
      if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);

      // Reassignment detection
      if (dto.assignedToId !== undefined && dto.assignedToId !== task.assignedToId) {
        const oldAssigneeId = task.assignedToId;
        const newAssigneeId = dto.assignedToId || null;

        updateData.assignedToId = newAssigneeId;

        // Automatically adjust status if assigning from not_assigned
        if (newAssigneeId && task.status === TaskStatus.not_assigned) {
          updateData.status = TaskStatus.assigned;
        } else if (!newAssigneeId && task.status === TaskStatus.assigned) {
          updateData.status = TaskStatus.not_assigned;
        }

        // Write activity log
        const action = oldAssigneeId ? ActivityAction.reassigned : ActivityAction.assigned;
        await tx.activityLog.create({
          data: {
            taskId: task.id,
            userId,
            action,
            metadata: {
              oldAssigneeId,
              newAssigneeId,
            },
          },
        });
      }

      const updatedTask = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
        },
      });

      return updatedTask;
    });
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id, isDeleted: false },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      if (task.status === dto.status) {
        return task;
      }

      const updateData: any = { status: dto.status };

      // Rule: Setting status to completed forces progress = 100
      if (dto.status === TaskStatus.completed) {
        updateData.progress = 100;
        updateData.completedAt = new Date();
      }

      const updatedTask = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
        },
      });

      // Log status updated action
      await tx.activityLog.create({
        data: {
          taskId: task.id,
          userId,
          action: ActivityAction.status_updated,
          metadata: {
            previousStatus: task.status,
            newStatus: dto.status,
          },
        },
      });

      return updatedTask;
    });
  }

  async updateProgress(id: string, dto: UpdateTaskProgressDto, userId: string) {
    if (dto.progress < 0 || dto.progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id, isDeleted: false },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const updateData: any = { progress: dto.progress };

      // Rule: progress == 100 forces status to completed and completedAt to current timestamp
      if (dto.progress === 100) {
        updateData.status = TaskStatus.completed;
        updateData.completedAt = new Date();
      } else if (task.status === TaskStatus.completed && dto.progress < 100) {
        updateData.status = TaskStatus.in_progress;
        updateData.completedAt = null;
      }

      const updatedTask = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
        },
      });

      // Log progress log
      await tx.progressUpdate.create({
        data: {
          taskId: task.id,
          userId,
          percentage: dto.progress,
          comment: dto.comment || null,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          taskId: task.id,
          userId,
          action: ActivityAction.progress_updated,
          metadata: {
            previousProgress: task.progress,
            newProgress: dto.progress,
            comment: dto.comment || null,
          },
        },
      });

      return updatedTask;
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id, isDeleted: false },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      await tx.task.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          taskId: id,
          userId,
          action: ActivityAction.deleted,
        },
      });

      return { success: true };
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async findDetails(id: string) {
    const taskDetails = await this.prisma.task.findFirst({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        progressUpdates: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!taskDetails) {
      throw new NotFoundException('Task not found');
    }

    return {
      task: {
        id: taskDetails.id,
        name: taskDetails.name,
        category: taskDetails.category,
        priority: taskDetails.priority,
        status: taskDetails.status,
        progress: taskDetails.progress,
        startDate: taskDetails.startDate,
        dueDate: taskDetails.dueDate,
        notes: taskDetails.notes,
        completedAt: taskDetails.completedAt,
        createdAt: taskDetails.createdAt,
        updatedAt: taskDetails.updatedAt,
        createdBy: taskDetails.createdBy,
        assignedTo: taskDetails.assignedTo,
      },
      comments: taskDetails.comments,
      progressUpdates: taskDetails.progressUpdates,
      activityLogs: taskDetails.activityLogs,
    };
  }

  async findAll(query: TaskQuery) {
    const page = Math.max(1, query.page || 1);
    let limit = Math.max(1, query.limit || 20);
    if (limit > 100) {
      limit = 100;
    }
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isDeleted: false,
    };

    if (query.status) whereClause.status = query.status;
    if (query.priority) whereClause.priority = query.priority;
    if (query.category) whereClause.category = query.category;
    if (query.assigneeId) whereClause.assignedToId = query.assigneeId;

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { notes: { contains: query.search, mode: 'insensitive' as const } },
        { assignedTo: { name: { contains: query.search, mode: 'insensitive' as const } } },
      ];
    }

    const orderByClause: any = {};
    if (query.sortBy) {
      orderByClause[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderByClause.dueDate = 'asc';
    }

    const [total, tasks] = await this.prisma.$transaction([
      this.prisma.task.count({ where: whereClause }),
      this.prisma.task.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
        },
      }),
    ]);

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMeTasks(userId: string, query: TaskQuery) {
    return this.findAll({
      ...query,
      assigneeId: userId,
    });
  }

  async addComment(taskId: string, message: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, isDeleted: false },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const comment = await tx.comment.create({
        data: {
          taskId,
          userId,
          message,
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          task: true,
        },
      });

      await tx.activityLog.create({
        data: {
          taskId,
          userId,
          action: ActivityAction.comment_added,
          metadata: { commentId: comment.id },
        },
      });

      return comment;
    });
  }

  async getComments(taskId: string, query: { page?: number; limit?: number }) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const page = Math.max(1, query.page || 1);
    let limit = Math.max(1, query.limit || 20);
    if (limit > 100) {
      limit = 100;
    }
    const skip = (page - 1) * limit;

    const [total, comments] = await this.prisma.$transaction([
      this.prisma.comment.count({ where: { taskId } }),
      this.prisma.comment.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          message: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    const formattedComments = comments.map(c => ({
      id: c.id,
      message: c.message,
      createdAt: c.createdAt,
      userId: c.user?.id,
      userName: c.user?.name,
      avatar: c.user?.avatar,
      user: c.user,
    }));

    return {
      data: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProgressHistory(taskId: string, query: { page?: number; limit?: number }) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const page = Math.max(1, query.page || 1);
    let limit = Math.max(1, query.limit || 20);
    if (limit > 100) {
      limit = 100;
    }
    const skip = (page - 1) * limit;

    const [total, history] = await this.prisma.$transaction([
      this.prisma.progressUpdate.count({ where: { taskId } }),
      this.prisma.progressUpdate.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    const formattedHistory = history.map(h => ({
      id: h.id,
      percentage: h.percentage,
      comment: h.comment,
      createdAt: h.createdAt,
      user: h.user,
    }));

    return {
      data: formattedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivityTimeline(taskId: string, query: { page?: number; limit?: number }) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const page = Math.max(1, query.page || 1);
    let limit = Math.max(1, query.limit || 20);
    if (limit > 100) {
      limit = 100;
    }
    const skip = (page - 1) * limit;

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.activityLog.count({ where: { taskId } }),
      this.prisma.activityLog.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
