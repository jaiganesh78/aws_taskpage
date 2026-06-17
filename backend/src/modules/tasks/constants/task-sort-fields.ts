export const VALID_TASK_SORT_FIELDS = ['dueDate', 'priority', 'createdAt', 'updatedAt', 'status'] as const;
export type TaskSortField = typeof VALID_TASK_SORT_FIELDS[number];
