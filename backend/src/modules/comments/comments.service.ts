import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityAction } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async remove(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      await tx.comment.delete({
        where: { id },
      });

      await tx.activityLog.create({
        data: {
          taskId: comment.taskId,
          userId,
          action: ActivityAction.comment_deleted,
          metadata: { commentId: id },
        },
      });

      return { success: true };
    });
  }
}
