import { Module } from '@nestjs/common';
import { CrewService } from './crew.service';
import { CrewController } from './crew.controller';
import { WorkloadService } from './services/workload.service';

@Module({
  controllers: [CrewController],
  providers: [CrewService, WorkloadService],
  exports: [CrewService, WorkloadService],
})
export class CrewModule {}
