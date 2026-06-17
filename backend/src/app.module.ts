import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { appConfig, validate } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CrewModule } from './modules/crew/crew.module';
import { CommentsModule } from './modules/comments/comments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate,
    }),
    PrismaModule,
    TasksModule,
    CrewModule,
    CommentsModule,
    DashboardModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
