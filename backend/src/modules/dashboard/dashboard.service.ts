import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();

    // 1. Get task statistics
    const tasks = await this.prisma.task.findMany({
      where: { isDeleted: false },
      select: {
        status: true,
        dueDate: true,
      },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const activeTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate < now).length;
    const completionRate = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;

    // 2. Get crew statistics
    const crewMembers = await this.prisma.user.findMany({
      where: { role: 'crew' },
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

    const totalCrew = crewMembers.length;
    let availableCrew = 0;
    let busyCrew = 0;
    let overloadedCrew = 0;

    for (const m of crewMembers) {
      const active = m.assignedTasks.filter(t => t.status !== 'completed');
      const overdue = active.filter(t => t.dueDate < now);

      const activeCount = active.length;
      const overdueCount = overdue.length;

      if (activeCount > 3 || overdueCount > 0) {
        overloadedCrew++;
      } else if (activeCount > 0) {
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
    const tasks = await this.prisma.task.findMany({
      where: { isDeleted: false },
      select: {
        category: true,
        priority: true,
        status: true,
      },
    });

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

    for (const t of tasks) {
      if (t.category in byCategory) byCategory[t.category]++;
      if (t.priority in byPriority) byPriority[t.priority]++;
      if (t.status in byStatus) byStatus[t.status]++;
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
      where: { role: 'crew' },
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

      let workloadStatus: 'available' | 'busy' | 'overloaded' = 'available';
      if (activeTaskCount > 3 || overdueTaskCount > 0) {
        workloadStatus = 'overloaded';
      } else if (activeTaskCount > 0) {
        workloadStatus = 'busy';
      }

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
