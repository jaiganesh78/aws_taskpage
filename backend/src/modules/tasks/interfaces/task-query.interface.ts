import { Category, Priority, TaskStatus } from '@prisma/client';

export interface TaskQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: Priority;
  category?: Category;
  assigneeId?: string;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
  onlyArchived?: boolean;
}
