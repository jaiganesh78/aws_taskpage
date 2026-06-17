import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkloadService } from '../crew/services/workload.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workloadService: WorkloadService,
  ) {}

  async getSummary() {
    const now = new Date();

    // Concurrently fetch counts and data using Promise.all to avoid sequential blocking
    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      crewMembers
    ] = await Promise.all([
      this.prisma.task.count({
        where: { isDeleted: false },
      }),
      this.prisma.task.count({
        where: { isDeleted: false, status: 'completed' },
      }),
      this.prisma.task.count({
        where: {
          isDeleted: false,
          status: { not: 'completed' },
          dueDate: { lt: now },
        },
      }),
      this.prisma.user.findMany({
        where: { role: 'crew', isActive: true }, // Exclude inactive crew members
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

    const activeTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;

    const totalCrew = crewMembers.length;
    let availableCrew = 0;
    let busyCrew = 0;
    let overloadedCrew = 0;

    for (const m of crewMembers) {
      const active = m.assignedTasks.filter(t => t.status !== 'completed');
      const overdue = active.filter(t => t.dueDate < now);

      const activeCount = active.length;
      const overdueCount = overdue.length;

      const workloadStatus = this.workloadService.calculateWorkloadStatus(activeCount, overdueCount);
      if (workloadStatus === 'overloaded') {
        overloadedCrew++;
      } else if (workloadStatus === 'busy') {
        busyCrew++;
      } else {
        availableCrew++;
      }
    }

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      overdueTasks,
      completionRate,
      totalCrew,
      availableCrew,
      busyCrew,
      overloadedCrew,
    };
  }

  async getTaskDistribution() {
    // Perform database-level group counts
    const [categories, priorities, statuses] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['category'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
    ]);

    const byCategory: Record<string, number> = { pre_event: 0, during_event: 0, post_event: 0 };
    const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byStatus: Record<string, number> = {
      not_assigned: 0,
      assigned: 0,
      yet_to_start: 0,
      in_progress: 0,
      under_review: 0,
      completed: 0,
      blocked: 0,
    };

    for (const c of categories) {
      if (c.category in byCategory) {
        byCategory[c.category] = c._count._all;
      }
    }
    for (const p of priorities) {
      if (p.priority in byPriority) {
        byPriority[p.priority] = p._count._all;
      }
    }
    for (const s of statuses) {
      if (s.status in byStatus) {
        byStatus[s.status] = s._count._all;
      }
    }

    return {
      byCategory,
      byPriority,
      byStatus,
    };
  }

  async getRecentActivity() {
    const logs = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        task: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return logs.map(l => ({
      id: l.id,
      action: l.action,
      metadata: l.metadata,
      createdAt: l.createdAt,
      task: l.task,
      user: l.user,
    }));
  }

  async getUpcomingDeadlines() {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        isDeleted: false,
        status: { not: 'completed' },
        dueDate: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return tasks.map(t => {
      const diffTime = t.dueDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return {
        id: t.id,
        name: t.name,
        dueDate: t.dueDate,
        priority: t.priority,
        daysRemaining,
        assignee: t.assignedTo,
      };
    });
  }

  async getWorkloads() {
    const now = new Date();
    const crew = await this.prisma.user.findMany({
      where: { role: 'crew', isActive: true }, // Filter active crew members only
      include: {
        assignedTasks: {
          where: { isDeleted: false },
          select: {
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return crew.map(m => {
      const active = m.assignedTasks.filter(t => t.status !== 'completed');
      const completed = m.assignedTasks.filter(t => t.status === 'completed');
      const overdue = active.filter(t => t.dueDate < now);

      const activeTaskCount = active.length;
      const completedTaskCount = completed.length;
      const overdueTaskCount = overdue.length;

      const workloadStatus = this.workloadService.calculateWorkloadStatus(activeTaskCount, overdueTaskCount);

      return {
        crewId: m.id,
        name: m.name,
        activeTaskCount,
        completedTaskCount,
        overdueTaskCount,
        workloadStatus,
      };
    });
  }
}
