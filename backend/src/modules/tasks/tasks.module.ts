import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ReviewsController } from './reviews.controller';
import { AttachmentsController } from './attachments.controller';
import { CleanupService } from './cleanup.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [TasksController, ReviewsController, AttachmentsController],
  providers: [TasksService, CleanupService],
  exports: [TasksService],
})
export class TasksModule {}
