import { CrewMember, Task } from './types';

export const crewMembers: CrewMember[] = [
  { id: 'c1',  name: 'Abhijith K',                role: 'Design Lead',          avatar: '', tasksCompleted: 12, totalTasks: 15, completionRate: 80 },
  { id: 'c2',  name: 'Abimithren',                 role: 'Tech Lead',            avatar: '', tasksCompleted: 8,  totalTasks: 10, completionRate: 80 },
  { id: 'c3',  name: 'Balaambiga C A',             role: 'Content Lead',         avatar: '', tasksCompleted: 15, totalTasks: 18, completionRate: 83.3 },
  { id: 'c4',  name: 'Goutham R',                  role: 'Operations Lead',      avatar: '', tasksCompleted: 10, totalTasks: 12, completionRate: 83.3 },
  { id: 'c5',  name: 'Harini S',                   role: 'Social Media Lead',    avatar: '', tasksCompleted: 7,  totalTasks: 10, completionRate: 70 },
  { id: 'c6',  name: 'Jaiganesh G',                role: 'Event Coordinator',    avatar: '', tasksCompleted: 20, totalTasks: 22, completionRate: 90.9 },
  { id: 'c7',  name: 'Lakshminarasimhan Uppili',   role: 'Documentation Lead',   avatar: '', tasksCompleted: 5,  totalTasks: 8,  completionRate: 62.5 },
  { id: 'c8',  name: 'Neil Daniel A',              role: 'Media Lead',           avatar: '', tasksCompleted: 9,  totalTasks: 11, completionRate: 81.8 },
  { id: 'c9',  name: 'Rannesh Khumar B R',         role: 'Volunteer Coordinator',avatar: '', tasksCompleted: 14, totalTasks: 16, completionRate: 87.5 },
  { id: 'c10', name: 'Sam Devaraja J',             role: 'Technical Officer',    avatar: '', tasksCompleted: 6,  totalTasks: 9,  completionRate: 66.7 },
  { id: 'c11', name: 'Sudhish Raghavendhar',       role: 'Logistics Lead',       avatar: '', tasksCompleted: 11, totalTasks: 13, completionRate: 84.6 },
  { id: 'c12', name: 'Sunchitha VK',               role: 'PR & Outreach Lead',   avatar: '', tasksCompleted: 9,  totalTasks: 12, completionRate: 75 },
  { id: 'c13', name: 'V.S Thamilzh Selvan',        role: 'Programme Coordinator',avatar: '', tasksCompleted: 17, totalTasks: 19, completionRate: 89.5 },
];

const now = new Date();

function daysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const tasks: Task[] = [
  {
    id: 't1', name: 'Event Posters', category: 'pre_event', priority: 'high',
    status: 'completed', assignedTo: crewMembers[0], assignedBy: crewMembers[3],
    startDate: daysAgo(10), dueDate: daysAgo(2), notes: 'Design main event poster and social media variants',
    completionPercentage: 100, createdAt: daysAgo(10), completedAt: daysAgo(2), updatedAt: daysAgo(2),
  },
  {
    id: 't2', name: 'Venue Booking', category: 'pre_event', priority: 'critical',
    status: 'completed', assignedTo: crewMembers[3], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysAgo(1), notes: 'Confirm auditorium booking for June 20th',
    completionPercentage: 100, createdAt: daysAgo(14), completedAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: 't3', name: 'Speaker Coordination', category: 'pre_event', priority: 'critical',
    status: 'in_progress', assignedTo: crewMembers[1], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(2), notes: 'Confirm availability of guest speakers',
    completionPercentage: 65, createdAt: daysAgo(7), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't4', name: 'Registration Management', category: 'pre_event', priority: 'high',
    status: 'in_progress', assignedTo: crewMembers[8], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysFromNow(3), notes: 'Set up and manage registration system',
    completionPercentage: 45, createdAt: daysAgo(5), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't5', name: 'LinkedIn Content', category: 'pre_event', priority: 'medium',
    status: 'yet_to_start', assignedTo: crewMembers[2], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(5), notes: 'Draft event promotion posts for LinkedIn',
    completionPercentage: 0, createdAt: daysAgo(3), completedAt: null, updatedAt: daysAgo(3),
  },
  {
    id: 't6', name: 'PPT Preparation', category: 'pre_event', priority: 'medium',
    status: 'yet_to_start', assignedTo: crewMembers[0], assignedBy: crewMembers[1],
    startDate: daysAgo(0), dueDate: daysFromNow(7), notes: 'Create presentation for the event',
    completionPercentage: 0, createdAt: daysAgo(4), completedAt: null, updatedAt: daysAgo(4),
  },
  {
    id: 't7', name: 'WhatsApp Content', category: 'pre_event', priority: 'low',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(4), notes: 'Create WhatsApp broadcast messages',
    completionPercentage: 0, createdAt: daysAgo(2), completedAt: null, updatedAt: daysAgo(2),
  },
  {
    id: 't8', name: 'Photography', category: 'during_event', priority: 'high',
    status: 'assigned', assignedTo: crewMembers[7], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Cover all key moments during the event',
    completionPercentage: 0, createdAt: daysAgo(6), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't9', name: 'Stage Coordination', category: 'during_event', priority: 'high',
    status: 'assigned', assignedTo: crewMembers[5], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Manage stage schedule and speaker flow',
    completionPercentage: 0, createdAt: daysAgo(6), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't10', name: 'Emcee', category: 'during_event', priority: 'high',
    status: 'yet_to_start', assignedTo: crewMembers[4], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Prepare script and host the event',
    completionPercentage: 15, createdAt: daysAgo(5), completedAt: null, updatedAt: daysAgo(2),
  },
  {
    id: 't11', name: 'Volunteer Coordination', category: 'pre_event', priority: 'medium',
    status: 'completed', assignedTo: crewMembers[8], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysAgo(3), notes: 'Assign volunteers for event day duties',
    completionPercentage: 100, createdAt: daysAgo(8), completedAt: daysAgo(3), updatedAt: daysAgo(3),
  },
  {
    id: 't12', name: 'Banner Design', category: 'pre_event', priority: 'medium',
    status: 'under_review', assignedTo: crewMembers[0], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(1), notes: 'Design event banners and flex materials',
    completionPercentage: 90, createdAt: daysAgo(6), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't13', name: 'OD List Preparation', category: 'pre_event', priority: 'high',
    status: 'completed', assignedTo: crewMembers[6], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysAgo(4), notes: 'Prepare OD letters for attendees',
    completionPercentage: 100, createdAt: daysAgo(9), completedAt: daysAgo(4), updatedAt: daysAgo(4),
  },
  {
    id: 't14', name: 'Instagram Content', category: 'pre_event', priority: 'medium',
    status: 'blocked', assignedTo: crewMembers[4], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysAgo(1), notes: 'Create Instagram posts and stories',
    completionPercentage: 40, createdAt: daysAgo(5), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't15', name: 'Email Content', category: 'pre_event', priority: 'low',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(6), notes: 'Draft event announcement email',
    completionPercentage: 0, createdAt: daysAgo(1), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't16', name: 'Social Media Promotions', category: 'pre_event', priority: 'high',
    status: 'in_progress', assignedTo: crewMembers[4], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(3), notes: 'Schedule promotional posts across platforms',
    completionPercentage: 55, createdAt: daysAgo(4), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't17', name: 'Certificate Template Design', category: 'pre_event', priority: 'low',
    status: 'yet_to_start', assignedTo: crewMembers[0], assignedBy: crewMembers[6],
    startDate: daysAgo(0), dueDate: daysFromNow(8), notes: 'Design e-certificate template',
    completionPercentage: 0, createdAt: daysAgo(2), completedAt: null, updatedAt: daysAgo(2),
  },
  {
    id: 't18', name: 'Registration Desk', category: 'during_event', priority: 'high',
    status: 'assigned', assignedTo: crewMembers[8], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Manage attendee check-in at registration desk',
    completionPercentage: 0, createdAt: daysAgo(7), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't19', name: 'Technical Support', category: 'during_event', priority: 'critical',
    status: 'assigned', assignedTo: crewMembers[9], assignedBy: crewMembers[1],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Ensure AV equipment and presentations work',
    completionPercentage: 0, createdAt: daysAgo(7), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't20', name: 'E-Certificate Generation', category: 'post_event', priority: 'high',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(15), notes: 'Generate e-certificates for all participants',
    completionPercentage: 0, createdAt: daysAgo(1), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't21', name: 'Event Report Generation', category: 'post_event', priority: 'medium',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(17), notes: 'Compile comprehensive event report',
    completionPercentage: 0, createdAt: daysAgo(1), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't22', name: 'Feedback Collection', category: 'post_event', priority: 'medium',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(14), notes: 'Create and distribute feedback forms',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't23', name: 'Live Social Media Updates', category: 'during_event', priority: 'medium',
    status: 'assigned', assignedTo: crewMembers[4], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Post real-time updates during the event',
    completionPercentage: 0, createdAt: daysAgo(6), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't24', name: 'PPT Handling', category: 'during_event', priority: 'medium',
    status: 'yet_to_start', assignedTo: crewMembers[1], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Manage presentation transitions on stage',
    completionPercentage: 10, createdAt: daysAgo(5), completedAt: null, updatedAt: daysAgo(2),
  },
  {
    id: 't25', name: 'Crowd Management', category: 'during_event', priority: 'low',
    status: 'assigned', assignedTo: crewMembers[9], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Ensure orderly crowd movement',
    completionPercentage: 0, createdAt: daysAgo(5), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't26', name: 'Reminder Messages', category: 'pre_event', priority: 'medium',
    status: 'yet_to_start', assignedTo: crewMembers[2], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(6), notes: 'Send reminder to registered participants',
    completionPercentage: 0, createdAt: daysAgo(3), completedAt: null, updatedAt: daysAgo(3),
  },
  {
    id: 't27', name: 'Attendance Tracking', category: 'during_event', priority: 'high',
    status: 'assigned', assignedTo: crewMembers[6], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Track and record attendee attendance',
    completionPercentage: 0, createdAt: daysAgo(6), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't28', name: 'Event Report Drafting', category: 'during_event', priority: 'low',
    status: 'assigned', assignedTo: crewMembers[6], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(11), notes: 'Draft initial event report during the event',
    completionPercentage: 0, createdAt: daysAgo(4), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't29', name: 'Post Event Posters', category: 'post_event', priority: 'medium',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(12), notes: 'Design post-event highlight posters',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't30', name: 'LinkedIn Post', category: 'post_event', priority: 'high',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(13), notes: 'Write and publish event recap on LinkedIn',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't31', name: 'Instagram Highlights', category: 'post_event', priority: 'medium',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(13), notes: 'Create Instagram highlight reels',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't32', name: 'WhatsApp Thank You Message', category: 'post_event', priority: 'low',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(12), notes: 'Send thank you message to participants',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't33', name: 'OD Report Generation', category: 'post_event', priority: 'high',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(16), notes: 'Generate OD report for attendees',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't34', name: 'Media Archive Management', category: 'post_event', priority: 'low',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(18), notes: 'Organize and archive all event media',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't35', name: 'Attendance Consolidation', category: 'post_event', priority: 'medium',
    status: 'not_assigned', assignedTo: null, assignedBy: null,
    startDate: daysAgo(0), dueDate: daysFromNow(16), notes: 'Compile final attendance records',
    completionPercentage: 0, createdAt: daysAgo(0), completedAt: null, updatedAt: daysAgo(0),
  },
  {
    id: 't36', name: 'Guest Management', category: 'during_event', priority: 'critical',
    status: 'assigned', assignedTo: crewMembers[5], assignedBy: crewMembers[3],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Coordinate guest arrival and seating',
    completionPercentage: 20, createdAt: daysAgo(7), completedAt: null, updatedAt: daysAgo(1),
  },
  {
    id: 't37', name: 'Videography', category: 'during_event', priority: 'high',
    status: 'assigned', assignedTo: crewMembers[7], assignedBy: crewMembers[5],
    startDate: daysAgo(0), dueDate: daysFromNow(10), notes: 'Record key sessions and highlights',
    completionPercentage: 0, createdAt: daysAgo(6), completedAt: null, updatedAt: daysAgo(1),
  },
];

export const events: { id: string; name: string; status: 'upcoming' | 'completed' | 'ongoing'; date: string }[] = [
  { id: 'e1', name: 'AWS Cloud Summit 2026', status: 'upcoming',  date: daysFromNow(10) },
  { id: 'e2', name: 'DevOps Workshop',        status: 'completed', date: daysAgo(14) },
  { id: 'e3', name: 'GenAI Bootcamp',          status: 'completed', date: daysAgo(30) },
];
