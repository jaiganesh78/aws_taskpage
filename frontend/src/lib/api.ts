import type { Task, CrewMember, TaskStatus, Priority, TaskCategory, Comment, Activity, ProgressHistory } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Central error dispatch event
export interface ApiErrorDetail {
  message: string;
  status: number;
}

export function dispatchApiError(message: string, status: number) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('api-error', {
      detail: { message, status } as ApiErrorDetail
    });
    window.dispatchEvent(event);
  }
}

export function dispatchApiSuccess(message: string) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('api-success', {
      detail: message
    });
    window.dispatchEvent(event);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  
  // Retrieve selected developer user ID from local storage
  let userId = '';
  if (typeof window !== 'undefined') {
    userId = localStorage.getItem('selected_user_id') || '';
  }

  const isMultipart = options.body instanceof FormData;
  const headers = new Headers();
  if (!isMultipart) {
    headers.set('Content-Type', 'application/json');
  }
  if (userId) {
    headers.set('x-user-id', userId);
  }
  if (options.headers) {
    Object.entries(options.headers).forEach(([k, v]) => headers.set(k, v));
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }

    if (!res.ok) {
      const errMsg = json?.message || text || `Request failed with status ${res.status}`;
      dispatchApiError(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg, res.status);
      throw new Error(errMsg);
    }

    if (json && typeof json === 'object' && 'pagination' in json) {
      return {
        data: json.data,
        pagination: json.pagination
      } as T;
    }

    return (json?.data ?? json) as T;
  } catch (err: any) {
    if (!(err instanceof Error)) {
      dispatchApiError(err.message || 'Network connectivity error', 500);
    }
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request<{ success: boolean; status: string }>('/health'),

  // Users (for Dev selector context)
  getUsers: (params?: { role?: string; includeInactive?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.includeInactive) query.set('includeInactive', 'true');
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ data: CrewMember[]; pagination: any }>(`/users?${query.toString()}`);
  },

  // Dashboard Analytics
  getDashboardSummary: () => request<any>('/dashboard/summary'),
  getDashboardDistribution: () => request<any>('/dashboard/task-distribution'),
  getDashboardRecentActivity: () => request<any[]>('/dashboard/recent-activity'),
  getDashboardUpcomingDeadlines: () => request<any[]>('/dashboard/upcoming-deadlines'),
  getDashboardWorkloads: () => request<any[]>('/dashboard/workloads'),

  // Crew Management
  getCrew: (params?: { includeInactive?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.includeInactive) query.set('includeInactive', 'true');
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ data: CrewMember[]; pagination: any }>(`/crew?${query.toString()}`);
  },
  createCrew: (data: { name: string; email: string; department?: string; avatar?: string }) => 
    request<CrewMember>('/crew', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(res => {
      dispatchApiSuccess(`Crew member "${data.name}" added successfully.`);
      return res;
    }),
  deactivateCrew: (id: string, name: string) => 
    request<{ success: boolean }>(`/crew/${id}/deactivate`, {
      method: 'PATCH',
    }).then(res => {
      dispatchApiSuccess(`Crew member "${name}" deactivated successfully.`);
      return res;
    }),

  // Tasks Management
  getTasks: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    assigneeId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== 'all' && val !== '') {
          query.set(key, String(val));
        }
      });
    }
    return request<{ data: Task[]; pagination: any }>(`/tasks?${query.toString()}`);
  },
  
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  
  getTaskDetails: (id: string) => request<{
    task: Task;
    comments: Comment[];
    progressUpdates: ProgressHistory[];
    activityLogs: Activity[];
  }>(`/tasks/${id}/details`),

  createTask: (data: {
    name: string;
    category: TaskCategory;
    priority: Priority;
    assignedToId?: string;
    startDate?: string;
    dueDate: string;
    notes?: string;
  }) => request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(res => {
    dispatchApiSuccess(`Task "${data.name}" assigned successfully.`);
    return res;
  }),

  updateTask: (id: string, data: {
    name?: string;
    category?: TaskCategory;
    priority?: Priority;
    assignedToId?: string | null;
    startDate?: string | null;
    dueDate?: string;
    notes?: string | null;
  }) => request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }).then(res => {
    dispatchApiSuccess(`Task updated successfully.`);
    return res;
  }),

  updateTaskStatus: (id: string, status: TaskStatus) => 
    request<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then(res => {
      dispatchApiSuccess(`Task status updated to "${status.replace('_', ' ')}".`);
      return res;
    }),

  updateTaskProgress: (id: string, progress: number, comment?: string) => 
    request<Task>(`/tasks/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress, comment }),
    }).then(res => {
      dispatchApiSuccess(`Progress updated to ${progress}%.`);
      return res;
    }),

  deleteTask: (id: string) => 
    request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    }).then(res => {
      dispatchApiSuccess(`Task soft-deleted successfully.`);
      return res;
    }),

  getMyTasks: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ data: Task[]; pagination: any }>(`/tasks/me/tasks?${query.toString()}`);
  },

  // Task Sub-Resources (for detailed pagination)
  getComments: (taskId: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ data: Comment[]; pagination: any }>(`/tasks/${taskId}/comments?${query.toString()}`);
  },

  addComment: (taskId: string, message: string) => 
    request<Comment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }).then(res => {
      dispatchApiSuccess(`Comment added.`);
      return res;
    }),

  deleteComment: (commentId: string) => 
    request<{ success: boolean }>(`/comments/${commentId}`, {
      method: 'DELETE',
    }).then(res => {
      dispatchApiSuccess(`Comment deleted.`);
      return res;
    }),

  getProgressHistory: (taskId: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ data: ProgressHistory[]; pagination: any }>(`/tasks/${taskId}/progress-history?${query.toString()}`);
  },

  getActivityTimeline: (taskId: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ data: Activity[]; pagination: any }>(`/tasks/${taskId}/activity?${query.toString()}`);
  },

  uploadFile: (file: File, taskId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>(`/tasks/upload?taskId=${taskId}`, {
      method: 'POST',
      body: formData,
    });
  },

  submitWorkUpdate: (taskId: string, data: {
    description: string;
    progress: number;
    attachments: { fileName: string; fileUrl: string; fileType: string; fileSize: number }[];
  }) => request<any>(`/tasks/${taskId}/work-updates`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(res => {
    dispatchApiSuccess('Work update submitted successfully.');
    return res;
  }),

  getWorkUpdates: (taskId: string) => request<any[]>(`/tasks/${taskId}/work-updates`),

  submitReviewDecision: (taskId: string, data: {
    decision: 'approved' | 'changes_requested';
    comment: string;
  }) => request<any>(`/tasks/${taskId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(res => {
    dispatchApiSuccess(`Review decision "${data.decision}" submitted.`);
    return res;
  }),

  getReviews: (taskId: string) => request<any[]>(`/tasks/${taskId}/reviews`),

  getFiles: (taskId: string) => request<{
    images: any[];
    documents: any[];
    pdfs: any[];
    archives: any[];
    others: any[];
  }>(`/tasks/${taskId}/files`),

  deleteAttachment: (attachmentId: string) => request<any>(`/attachments/${attachmentId}`, {
    method: 'DELETE',
  }).then(res => {
    dispatchApiSuccess('Attachment deleted.');
    return res;
  }),

  getReviewQueue: () => request<any[]>('/reviews/queue'),

  getAnalytics: () => request<any>('/dashboard/analytics'),
};
