export type TaskCategory = 'pre_event' | 'during_event' | 'post_event';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'not_assigned' | 'assigned' | 'yet_to_start' | 'in_progress' | 'under_review' | 'completed' | 'blocked';

export interface CrewMember {
  id: string;
  name: string;
  email: string;
  role: 'core' | 'crew';
  avatar: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  activeTaskCount?: number;
  completedTaskCount?: number;
  overdueTaskCount?: number;
  workloadStatus?: 'available' | 'busy' | 'overloaded';
}

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  assignedTo: CrewMember | null;
  createdBy: CrewMember;
  startDate: string | null;
  dueDate: string;
  notes: string | null;
  progress: number;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface Activity {
  id: string;
  taskId: string;
  action: string;
  userId: string;
  user?: CrewMember;
  metadata?: any;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  createdAt: string;
  userName?: string;
  avatar?: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface ProgressHistory {
  id: string;
  taskId: string;
  userId: string;
  percentage: number;
  comment: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'pre_event', label: 'Pre Event', color: '#FF9900' },
  { value: 'during_event', label: 'During Event', color: '#232F3E' },
  { value: 'post_event', label: 'Post Event', color: '#2E8B57' },
];

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#6B7280' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#FF9900' },
  { value: 'critical', label: 'Critical', color: '#EF4444' },
];

export const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'not_assigned', label: 'Not Assigned', color: '#9CA3AF' },
  { value: 'assigned', label: 'Assigned', color: '#3B82F6' },
  { value: 'yet_to_start', label: 'Yet To Start', color: '#F59E0B' },
  { value: 'in_progress', label: 'In Progress', color: '#FF9900' },
  { value: 'under_review', label: 'Under Review', color: '#8B5CF6' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'blocked', label: 'Blocked', color: '#EF4444' },
];

export const PRE_EVENT_TASKS = [
  'Event Posters', 'Email Content', 'WhatsApp Content', 'Instagram Content',
  'LinkedIn Content', 'Reminder Messages', 'Speaker Coordination',
  'Registration Management', 'Venue Booking', 'OD List Preparation',
  'PPT Preparation', 'Volunteer Coordination', 'Social Media Promotions',
  'Banner Design', 'Certificate Template Design',
];

export const DURING_EVENT_TASKS = [
  'Photography', 'Videography', 'Emcee', 'Registration Desk',
  'Stage Coordination', 'PPT Handling', 'Live Social Media Updates',
  'Guest Management', 'Technical Support', 'Attendance Tracking',
  'Crowd Management', 'Event Report Drafting',
];

export const POST_EVENT_TASKS = [
  'Event Report Generation', 'Post Event Posters', 'LinkedIn Post',
  'Instagram Highlights', 'WhatsApp Thank You Message',
  'E-Certificate Generation', 'OD Report Generation', 'Feedback Collection',
  'Media Archive Management', 'Attendance Consolidation',
];

export const TASKS_BY_CATEGORY: Record<TaskCategory, string[]> = {
  pre_event: PRE_EVENT_TASKS,
  during_event: DURING_EVENT_TASKS,
  post_event: POST_EVENT_TASKS,
};
