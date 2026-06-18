import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskProgressDto } from './dto/update-task-progress.dto';
import { CreateWorkUpdateDto } from './dto/create-work-update.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { StorageService } from '../storage/storage.service';
import { TaskQuery } from './interfaces/task-query.interface';
import { TaskStatus, ActivityAction, ReviewDecisionType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
          assignedAt: dto.assignedToId ? new Date() : null,
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

      if (dto.reviewAssignedToId !== undefined && dto.reviewAssignedToId !== task.reviewAssignedToId) {
        updateData.reviewAssignedToId = dto.reviewAssignedToId || null;
        updateData.reviewAssignedAt = dto.reviewAssignedToId ? new Date() : null;
      }

      // Reassignment detection
      if (dto.assignedToId !== undefined && dto.assignedToId !== task.assignedToId) {
        const oldAssigneeId = task.assignedToId;
        const newAssigneeId = dto.assignedToId || null;

        updateData.assignedToId = newAssigneeId;
        updateData.assignedAt = newAssigneeId ? new Date() : null;

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
        reviewAssignedTo: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        progressUpdates: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        workUpdates: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            attachments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        reviewDecisions: {
          include: {
            reviewer: { select: { id: true, name: true, avatar: true } },
            workUpdate: true,
          },
          orderBy: { createdAt: 'desc' },
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
        archivedAt: taskDetails.archivedAt,
        assignedAt: taskDetails.assignedAt,
        submittedAt: taskDetails.submittedAt,
        reviewedAt: taskDetails.reviewedAt,
        reviewAssignedToId: taskDetails.reviewAssignedToId,
        reviewAssignedAt: taskDetails.reviewAssignedAt,
        createdAt: taskDetails.createdAt,
        updatedAt: taskDetails.updatedAt,
        createdBy: taskDetails.createdBy,
        assignedTo: taskDetails.assignedTo,
        reviewAssignedTo: taskDetails.reviewAssignedTo,
      },
      comments: taskDetails.comments,
      progressUpdates: taskDetails.progressUpdates,
      activityLogs: taskDetails.activityLogs,
      workUpdates: taskDetails.workUpdates,
      reviewDecisions: taskDetails.reviewDecisions,
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

    if (query.onlyArchived) {
      whereClause.archivedAt = { not: null };
    } else if (query.includeArchived) {
      // Includes both archived and unarchived
    } else {
      whereClause.archivedAt = null;
    }

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

  async submitWorkUpdate(taskId: string, dto: CreateWorkUpdateDto, userId: string) {
    // 1. Verify task exists
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. Automatically increment revision number
    const latestUpdate = await this.prisma.workUpdate.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    const revisionNumber = latestUpdate ? latestUpdate.revisionNumber + 1 : 1;

    // 3. Create records in transaction
    return this.prisma.$transaction(async (tx) => {
      // Create WorkUpdate
      const workUpdate = await tx.workUpdate.create({
        data: {
          taskId,
          userId,
          description: dto.description,
          progress: dto.progress,
          revisionNumber,
        },
        include: {
          attachments: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      // Create attachments
      if (dto.attachments && dto.attachments.length > 0) {
        for (const attachment of dto.attachments) {
          await tx.workAttachment.create({
            data: {
              workUpdateId: workUpdate.id,
              fileName: attachment.fileName,
              fileUrl: attachment.fileUrl,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize,
            },
          });

          // Log attachment activity
          await tx.activityLog.create({
            data: {
              taskId,
              userId,
              action: ActivityAction.attachment_added,
              metadata: {
                fileName: attachment.fileName,
                fileUrl: attachment.fileUrl,
              },
            },
          });
        }
      }

      // Reload work update to get attachments
      const reloadedWorkUpdate = await tx.workUpdate.findUnique({
        where: { id: workUpdate.id },
        include: {
          attachments: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      // Update Task status, progress, and submittedAt
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.under_review,
          progress: dto.progress,
          submittedAt: new Date(),
        },
      });

      // Log submission activity
      await tx.activityLog.create({
        data: {
          taskId,
          userId,
          action: ActivityAction.work_submitted,
          metadata: {
            progress: dto.progress,
            revisionNumber,
          },
        },
      });

      // Log status updated
      if (task.status !== TaskStatus.under_review) {
        await tx.activityLog.create({
          data: {
            taskId,
            userId,
            action: ActivityAction.status_updated,
            metadata: {
              previousStatus: task.status,
              newStatus: TaskStatus.under_review,
            },
          },
        });
      }

      return reloadedWorkUpdate;
    });
  }

  async submitReviewDecision(taskId: string, dto: SubmitReviewDto, userId: string, userRole: string) {
    if (userRole !== 'core') {
      throw new ForbiddenException('Only Core members can review tasks.');
    }

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Enforce review ownership
    if (task.reviewAssignedToId && task.reviewAssignedToId !== userId) {
      throw new ForbiddenException('You are not the assigned reviewer for this task.');
    }

    const latestWorkUpdate = await this.prisma.workUpdate.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return this.prisma.$transaction(async (tx) => {
      // If reviewer was not explicitly assigned, take ownership automatically
      const reviewAssignUpdate: any = {};
      if (!task.reviewAssignedToId) {
        reviewAssignUpdate.reviewAssignedToId = userId;
        reviewAssignUpdate.reviewAssignedAt = new Date();
      }

      const reviewDecision = await tx.reviewDecision.create({
        data: {
          taskId,
          reviewerId: userId,
          workUpdateId: latestWorkUpdate ? latestWorkUpdate.id : null,
          decision: dto.decision,
          comment: dto.comment,
        },
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
          workUpdate: true,
        },
      });

      const nextStatus =
        dto.decision === ReviewDecisionType.approved
          ? TaskStatus.completed
          : TaskStatus.blocked; // Changes Requested maps to blocked

      const taskUpdateData: any = {
        ...reviewAssignUpdate,
        status: nextStatus,
        reviewedAt: new Date(),
      };

      if (dto.decision === ReviewDecisionType.approved) {
        taskUpdateData.progress = 100;
        taskUpdateData.completedAt = new Date();
      }

      await tx.task.update({
        where: { id: taskId },
        data: taskUpdateData,
      });

      // Log review activity
      await tx.activityLog.create({
        data: {
          taskId,
          userId,
          action:
            dto.decision === ReviewDecisionType.approved
              ? ActivityAction.review_approved
              : ActivityAction.review_changes_requested,
          metadata: {
            comment: dto.comment,
            revisionNumber: latestWorkUpdate ? latestWorkUpdate.revisionNumber : null,
          },
        },
      });

      // Log status updated
      if (task.status !== nextStatus) {
        await tx.activityLog.create({
          data: {
            taskId,
            userId,
            action: ActivityAction.status_updated,
            metadata: {
              previousStatus: task.status,
              newStatus: nextStatus,
            },
          },
        });
      }

      return reviewDecision;
    });
  }

  async getWorkUpdates(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.workUpdate.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getReviews(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.reviewDecision.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        workUpdate: true,
      },
    });
  }

  async getFiles(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const attachments = await this.prisma.workAttachment.findMany({
      where: {
        workUpdate: {
          taskId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const images: any[] = [];
    const documents: any[] = [];
    const pdfs: any[] = [];
    const archives: any[] = [];
    const others: any[] = [];

    for (const file of attachments) {
      const ext = path.extname(file.fileName).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext) || file.fileType.startsWith('image/')) {
        images.push(file);
      } else if (ext === '.pdf' || file.fileType === 'application/pdf') {
        pdfs.push(file);
      } else if (['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'].includes(ext)) {
        documents.push(file);
      } else if (['.zip', '.rar', '.tar', '.gz'].includes(ext)) {
        archives.push(file);
      } else {
        others.push(file);
      }
    }

    return {
      images,
      documents,
      pdfs,
      archives,
      others,
    };
  }

  async deleteAttachment(attachmentId: string, userId: string, userRole: string) {
    const attachment = await this.prisma.workAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        workUpdate: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Only creator of the workUpdate OR a Core user can delete attachments
    if (userRole !== 'core' && attachment.workUpdate.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this attachment.');
    }

    // 1. Delete file using storage service
    await this.storageService.deleteFile(attachment.fileUrl);

    // 2. Delete database record
    await this.prisma.workAttachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  }

  // Get active review queue with SLA logic calculated in backend
  async getReviewQueue(user: { id: string; role: string }) {
    if (user.role !== 'core') {
      throw new ForbiddenException('Access denied to Core workspace.');
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.under_review,
        isDeleted: false,
      },
      orderBy: { submittedAt: 'asc' }, // Awaiting reviews, oldest first
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true, department: true } },
        reviewAssignedTo: { select: { id: true, name: true, avatar: true } },
        workUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            attachments: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    const now = new Date().getTime();

    return tasks.map(task => {
      const submittedTime = task.submittedAt ? new Date(task.submittedAt).getTime() : new Date(task.createdAt).getTime();
      const diffHours = (now - submittedTime) / 3600000;

      let sla: 'fresh' | 'waiting' | 'overdue' = 'fresh';
      if (diffHours >= 24) {
        sla = 'overdue';
      } else if (diffHours >= 4) {
        sla = 'waiting';
      }

      return {
        id: task.id,
        name: task.name,
        category: task.category,
        priority: task.priority,
        status: task.status,
        progress: task.progress,
        submittedAt: task.submittedAt,
        sla,
        assignedTo: task.assignedTo,
        reviewAssignedTo: task.reviewAssignedTo,
        latestRevision: task.workUpdates[0] || null,
      };
    });
  }
}
