import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CrewModule } from '../crew/crew.module';

@Module({
  imports: [PrismaModule, CrewModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
