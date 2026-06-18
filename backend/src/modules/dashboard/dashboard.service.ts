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

  async getAnalytics() {
    const now = new Date();

    // 1. Average Completion & Review Time
    const completedTasks = await this.prisma.task.findMany({
      where: {
        isDeleted: false,
        status: 'completed',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        assignedAt: true,
        submittedAt: true,
        reviewedAt: true,
        completedAt: true,
      },
    });

    let totalCompletionTimeMs = 0;
    let completionCount = 0;
    let totalReviewTimeMs = 0;
    let reviewCount = 0;

    for (const t of completedTasks) {
      if (t.completedAt) {
        const start = t.assignedAt || t.createdAt;
        totalCompletionTimeMs += t.completedAt.getTime() - start.getTime();
        completionCount++;
      }
      if (t.reviewedAt && t.submittedAt) {
        totalReviewTimeMs += t.reviewedAt.getTime() - t.submittedAt.getTime();
        reviewCount++;
      }
    }

    const averageCompletionTimeHours = completionCount > 0 
      ? parseFloat((totalCompletionTimeMs / (1000 * 60 * 60 * completionCount)).toFixed(2)) 
      : 0;

    const averageReviewTimeHours = reviewCount > 0 
      ? parseFloat((totalReviewTimeMs / (1000 * 60 * 60 * reviewCount)).toFixed(2)) 
      : 0;

    // 2. Most Active Crew (by work updates submitted)
    const workUpdatesGrouped = await this.prisma.workUpdate.groupBy({
      by: ['userId'],
      _count: {
        _all: true,
      },
    });

    const crewIds = workUpdatesGrouped.map(w => w.userId);
    const crews = await this.prisma.user.findMany({
      where: { id: { in: crewIds }, role: 'crew' },
      select: { id: true, name: true, avatar: true },
    });

    const mostActiveCrew = workUpdatesGrouped
      .map(w => {
        const user = crews.find(c => c.id === w.userId);
        return {
          id: w.userId,
          name: user?.name || 'Unknown',
          avatar: user?.avatar || null,
          updatesCount: w._count._all,
        };
      })
      .filter(w => w.name !== 'Unknown')
      .sort((a, b) => b.updatesCount - a.updatesCount)
      .slice(0, 5);

    // 3. Most Active Reviewers (by review decisions submitted)
    const reviewDecisionsGrouped = await this.prisma.reviewDecision.groupBy({
      by: ['reviewerId'],
      _count: {
        _all: true,
      },
    });

    const reviewerIds = reviewDecisionsGrouped.map(r => r.reviewerId);
    const reviewers = await this.prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true, avatar: true },
    });

    const mostActiveReviewers = reviewDecisionsGrouped
      .map(r => {
        const user = reviewers.find(u => u.id === r.reviewerId);
        return {
          id: r.reviewerId,
          name: user?.name || 'Unknown',
          avatar: user?.avatar || null,
          reviewsCount: r._count._all,
        };
      })
      .filter(r => r.name !== 'Unknown')
      .sort((a, b) => b.reviewsCount - a.reviewsCount)
      .slice(0, 5);

    // 4. Review Queue SLA Aging (Fresh, Waiting, Overdue)
    const reviewQueueTasks = await this.prisma.task.findMany({
      where: {
        isDeleted: false,
        status: 'under_review',
      },
      select: {
        submittedAt: true,
        createdAt: true,
      },
    });

    let freshCount = 0;
    let waitingCount = 0;
    let overdueCount = 0;

    for (const t of reviewQueueTasks) {
      const submitTime = t.submittedAt || t.createdAt;
      const diffHours = (now.getTime() - submitTime.getTime()) / 3600000;
      if (diffHours >= 24) {
        overdueCount++;
      } else if (diffHours >= 4) {
        waitingCount++;
      } else {
        freshCount++;
      }
    }

    // 5. Workload Distribution (summary)
    const workloads = await this.getWorkloads();
    const workloadDistribution = {
      available: workloads.filter(w => w.workloadStatus === 'available').length,
      busy: workloads.filter(w => w.workloadStatus === 'busy').length,
      overloaded: workloads.filter(w => w.workloadStatus === 'overloaded').length,
    };

    // 6. Bottlenecks (overdue tasks, blocked tasks, slow tasks)
    const blockedCount = await this.prisma.task.count({
      where: { isDeleted: false, status: 'blocked' },
    });
    const overdueCountTotal = await this.prisma.task.count({
      where: {
        isDeleted: false,
        status: { not: 'completed' },
        dueDate: { lt: now },
      },
    });
    const bottleneckTasks = await this.prisma.task.findMany({
      where: {
        isDeleted: false,
        OR: [
          { status: 'blocked' },
          {
            status: { not: 'completed' },
            dueDate: { lt: now },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        dueDate: true,
        priority: true,
      },
      take: 5,
    });

    // 7. Distributions
    const distributions = await this.getTaskDistribution();

    // 8. Completion Trends (tasks completed per day for last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const completedRecently = await this.prisma.task.findMany({
      where: {
        isDeleted: false,
        status: 'completed',
        completedAt: { gte: sevenDaysAgo },
      },
      select: {
        completedAt: true,
      },
    });

    const completionTrends = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now.getTime() - idx * 24 * 60 * 60 * 1000);
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
      const count = completedRecently.filter(t => {
        if (!t.completedAt) return false;
        return t.completedAt.toDateString() === d.toDateString();
      }).length;
      return { day: dayLabel, completed: count };
    }).reverse();

    return {
      averageCompletionTimeHours,
      averageReviewTimeHours,
      mostActiveCrew,
      mostActiveReviewers,
      reviewQueueAging: {
        fresh: freshCount,
        waiting: waitingCount,
        overdue: overdueCount,
      },
      workloadDistribution,
      bottlenecks: {
        blockedCount,
        overdueCount: overdueCountTotal,
        list: bottleneckTasks,
      },
      distributions,
      completionTrends,
    };
  }
}
