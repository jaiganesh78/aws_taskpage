export interface CrewQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'workload';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}
