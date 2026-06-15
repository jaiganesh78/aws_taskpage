import { prisma } from '@/lib/prisma';
import type { Task, User, Category, Priority, TaskStatus, Comment, TaskStatus as PrismaTaskStatus } from '@prisma/client';

export type { Task, User, Category, Priority, TaskStatus, Comment };

export interface TaskWithRelations extends Task {
  assignedTo: User[];
  comments: (Comment & { user: User })[];
}

export interface DashboardStats {
  total: number;
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

const now = new Date();

export function getDerivedStatus(progress: number): PrismaTaskStatus {
  if (progress >= 100) return 'COMPLETED';
  if (progress > 0) return 'IN_PROGRESS';
  return 'YET_TO_START';
}

export function isTaskOverdue(dueDate: Date | string, status: PrismaTaskStatus): boolean {
  if (status === 'COMPLETED') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function getOverdueDays(dueDate: Date | string, completedAt?: Date | string | null): number {
  const due = new Date(dueDate);
  const end = completedAt ? new Date(completedAt) : new Date();
  const diff = end.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getDelayText(dueDate: Date | string, completedAt?: Date | string | null): string {
  const days = getOverdueDays(dueDate, completedAt);
  if (days === 0) return '';
  if (completedAt) return `Completed ${days} day${days === 1 ? '' : 's'} late`;
  return `Overdue by ${days} day${days === 1 ? '' : 's'}`;
}

export class TaskService {
  static async getAll() {
    return prisma.task.findMany({
      include: { assignedTo: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  static async getById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async getByAssignee(assigneeId: string) {
    return prisma.task.findMany({
      where: { assignedToId: assigneeId },
      include: { assignedTo: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  static async getUpcomingDeadlines(limit = 5) {
    return prisma.task.findMany({
      where: {
        status: { not: 'COMPLETED' },
      },
      include: { assignedTo: true },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
  }

  static async getOverdue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prisma.task.findMany({
      where: {
        dueDate: { lt: today },
        status: { not: 'COMPLETED' },
      },
      include: { assignedTo: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  static async getAnalytics() {
    const [totalResult, assignedResult, completedResult, pendingResult, overdueTasks, categoryGroup] =
      await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { status: { not: 'NOT_ASSIGNED' } } }),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.task.count({ where: { status: { not: 'COMPLETED' } } }),
        prisma.task.count({
          where: {
            dueDate: { lt: now },
            status: { not: 'COMPLETED' },
          },
        }),
        prisma.task.groupBy({
          by: ['category'],
          _count: { id: true },
          where: { status: 'COMPLETED' },
        }),
      ]);

    const completionRate = totalResult > 0 ? Math.round((completedResult / totalResult) * 100) : 0;

    return {
      total: totalResult,
      assigned: assignedResult,
      completed: completedResult,
      pending: pendingResult,
      overdue: overdueTasks,
      completionRate,
      categoryBreakdown: categoryGroup.map((c) => ({
        category: c.category,
        completed: c._count.id,
      })),
    };
  }

  static async getCategoryStats() {
    const grouped = await prisma.task.groupBy({
      by: ['category', 'status'],
      _count: { id: true },
    });

    const stats = new Map<string, { total: number; completed: number }>();

    for (const row of grouped) {
      const key = row.category;
      if (!stats.has(key)) {
        stats.set(key, { total: 0, completed: 0 });
      }
      const entry = stats.get(key)!;
      entry.total += row._count.id;
      if (row.status === 'COMPLETED') {
        entry.completed += row._count.id;
      }
    }

    return Array.from(stats.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  }

  static async create(data: {
    name: string;
    category: Category;
    priority: Priority;
    status?: TaskStatus;
    progress?: number;
    startDate?: Date;
    dueDate: Date;
    notes?: string;
    createdById: string;
    assignedToId?: string;
  }) {
    const { assignedToId, ...rest } = data;
    const task = await prisma.task.create({
      data: {
        ...rest,
        status: data.status ?? 'NOT_ASSIGNED',
        progress: data.progress ?? 0,
        assignedToId: assignedToId ?? '',
      },
      include: { assignedTo: true },
    });

    if (assignedToId && assignedToId !== '') {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId: assignedToId,
          assignedById: data.createdById,
          completionPercentage: task.progress,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        userId: data.createdById,
        action: 'CREATED',
        metadata: { taskName: task.name, category: task.category },
      },
    });

    return task;
  }

  static async updateStatus(taskId: string, status: TaskStatus) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    const completedAt = status === 'COMPLETED' ? new Date() : task.completedAt;
    const progress = status === 'COMPLETED' ? 100 : task.progress;

    return prisma.task.update({
      where: { id: taskId },
      data: { status, completedAt, progress },
      include: { assignedTo: true },
    });
  }

  static async updateProgress(taskId: string, progress: number, message?: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    const status = getDerivedStatus(progress);
    const completedAt = status === 'COMPLETED' ? new Date() : task.completedAt;

    return prisma.task.update({
      where: { id: taskId },
      data: { progress, status, completedAt },
      include: { assignedTo: true },
    });
  }

  static async addComment(taskId: string, userId: string, message: string) {
    return prisma.comment.create({
      data: {
        taskId,
        userId,
        message,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}

export class CrewService {
  static async getAll() {
    return prisma.user.findMany({
      where: { role: 'CREW' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
        _count: { select: { assignedTask: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
        _count: { select: { assignedTask: true } },
      },
    });
  }

  static async create(data: { name: string; email?: string; department?: string }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email ?? '',
        department: data.department ?? null,
        role: 'CREW',
        password: '',
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
    });
  }

  static async update(id: string, data: { name?: string; email?: string; department?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
