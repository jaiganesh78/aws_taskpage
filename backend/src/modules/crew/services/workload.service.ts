import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkloadService {
  calculateWorkloadStatus(activeTaskCount: number, overdueTaskCount: number): 'available' | 'busy' | 'overloaded' {
    if (activeTaskCount > 3 || overdueTaskCount > 0) {
      return 'overloaded';
    } else if (activeTaskCount > 0) {
      return 'busy';
    }
    return 'available';
  }
}
