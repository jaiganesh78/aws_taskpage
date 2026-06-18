import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { TaskStatus, ActivityAction } from '@prisma/client';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  // Run hourly archive job
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyArchiving() {
    this.logger.log('Starting hourly completed tasks archiving job...');
    const archiveHours = this.configService.get<number>('app.taskArchiveHours') || 48;
    const thresholdDate = new Date(Date.now() - archiveHours * 60 * 60 * 1000);

    try {
      // Find tasks completed before the threshold that are not yet archived
      const tasksToArchive = await this.prisma.task.findMany({
        where: {
          status: TaskStatus.completed,
          completedAt: { lte: thresholdDate },
          archivedAt: null,
          isDeleted: false,
        },
        select: { id: true, name: true },
      });

      if (tasksToArchive.length === 0) {
        this.logger.log('No completed tasks found eligible for archiving.');
        return;
      }

      this.logger.log(`Found ${tasksToArchive.length} tasks to archive. Archiving...`);

      for (const task of tasksToArchive) {
        await this.prisma.$transaction(async (tx) => {
          await tx.task.update({
            where: { id: task.id },
            data: { archivedAt: new Date() },
          });

          // System user ID or creator ID for activity log (use creator ID or a default system placeholder if available, else creator)
          const taskDetails = await tx.task.findUnique({
            where: { id: task.id },
            select: { createdById: true },
          });

          await tx.activityLog.create({
            data: {
              taskId: task.id,
              userId: taskDetails?.createdById || '',
              action: ActivityAction.archived,
              metadata: {
                systemArchived: true,
                archiveHoursThreshold: archiveHours,
              },
            },
          });
        });
        this.logger.log(`Archived task: "${task.name}" (${task.id})`);
      }

      this.logger.log(`Successfully completed archiving job. Archived ${tasksToArchive.length} tasks.`);
    } catch (err) {
      this.logger.error('Error occurred during hourly archiving job:', err);
    }
  }

  // Run daily cleanup job at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyPermanentDeletion() {
    this.logger.log('Starting daily permanent tasks cleanup job...');
    const deleteDays = this.configService.get<number>('app.taskDeleteDays') || 20;
    const thresholdDate = new Date(Date.now() - deleteDays * 24 * 60 * 60 * 1000);

    try {
      // Find tasks archived before the threshold
      const tasksToDelete = await this.prisma.task.findMany({
        where: {
          archivedAt: { lte: thresholdDate },
          isDeleted: false,
        },
        include: {
          workUpdates: {
            include: {
              attachments: true,
            },
          },
        },
      });

      if (tasksToDelete.length === 0) {
        this.logger.log('No archived tasks found eligible for permanent deletion.');
        return;
      }

      this.logger.log(`Found ${tasksToDelete.length} tasks to permanently delete. Cleaning files and databases...`);

      for (const task of tasksToDelete) {
        this.logger.log(`Permanently deleting task: "${task.name}" (${task.id})`);

        // 1. Delete all attachments files from S3/local storage
        for (const update of task.workUpdates) {
          for (const attachment of update.attachments) {
            try {
              this.logger.log(`Deleting storage file for attachment: ${attachment.fileName} (${attachment.fileUrl})`);
              await this.storageService.deleteFile(attachment.fileUrl);
            } catch (fileErr) {
              this.logger.error(`Failed to delete storage file for attachment ID: ${attachment.id}`, fileErr);
            }
          }
        }

        // 2. Delete task from database (cascading deletes comments, updates, decisions, logs, etc.)
        await this.prisma.task.delete({
          where: { id: task.id },
        });

        this.logger.log(`Successfully deleted task ${task.id} and all related child records from database.`);
      }

      this.logger.log(`Successfully completed daily cleanup job. Deleted ${tasksToDelete.length} tasks.`);
    } catch (err) {
      this.logger.error('Error occurred during daily permanent deletion job:', err);
    }
  }
}
