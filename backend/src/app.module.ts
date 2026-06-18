import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { appConfig, validate } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CrewModule } from './modules/crew/crew.module';
import { CommentsModule } from './modules/comments/comments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { UploadModule } from './modules/upload/upload.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TasksModule,
    CrewModule,
    CommentsModule,
    DashboardModule,
    UsersModule,
    UploadModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
