import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the local .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient, UserRole, Category, Priority, TaskStatus, ActivityAction } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Upgrading database seed...');
  console.log('Connecting to database...');

  // Clean existing tables (in order of dependencies)
  await prisma.activityLog.deleteMany();
  await prisma.progressUpdate.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Core User
  const coreUser = await prisma.user.create({
    data: {
      email: 'admin@awssbgrec.com',
      name: 'Admin Core',
      role: UserRole.core,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
      department: 'Management',
    },
  });
  console.log('Created CORE user:', coreUser.email);
  const coreId = coreUser.id;

  // 2. Create Crew Users
  const crewUsersData = [
    { id: 'c1', email: 'crew1@awssbgrec.com', name: 'Abhijith K', role: UserRole.crew, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=crew1', department: 'Design' },
    { id: 'c2', email: 'crew2@awssbgrec.com', name: 'Abimithren', role: UserRole.crew, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=crew2', department: 'Tech' },
    { id: 'c3', email: 'crew3@awssbgrec.com', name: 'Balaambiga C A', role: UserRole.crew, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=crew3', department: 'Content' },
    { id: 'c4', email: 'crew4@awssbgrec.com', name: 'Sudhish Raghavendhar', role: UserRole.crew, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=crew4', department: 'Logistics' },
    { id: 'c5', email: 'crew5@awssbgrec.com', name: 'Divya Sharma', role: UserRole.crew, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=crew5', department: 'PR & Marketing' },
    { id: 'c6', email: 'crew6@awssbgrec.com', name: 'Ezhil Kumar', role: UserRole.crew, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=crew6', department: 'Security' },
    { id: 'c7', email: 'crew7@awssbgrec.com', name: 'Farah Khan', role: UserRole.crew, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=crew7', department: 'Decorations' },
  ];

  for (const crew of crewUsersData) {
    await prisma.user.create({ data: crew });
  }
  console.log(`Created ${crewUsersData.length} CREW users successfully.`);

  // 3. Create Tasks
  const tasksData = [
    {
      id: 't1',
      name: 'Design main poster and flyers',
      category: Category.pre_event,
      priority: Priority.low,
      status: TaskStatus.completed,
      progress: 100,
      startDate: new Date(Date.now() - 10 * 86400000),
      dueDate: new Date(Date.now() - 5 * 86400000),
      notes: 'Initial designs for visual promotions. Use approved brand styles.',
      createdById: coreId,
      assignedToId: 'c1',
      completedAt: new Date(Date.now() - 6 * 86400000),
    },
    {
      id: 't2',
      name: 'AV setup & sound checks',
      category: Category.during_event,
      priority: Priority.critical,
      status: TaskStatus.completed,
      progress: 100,
      startDate: new Date(Date.now() - 2 * 86400000),
      dueDate: new Date(Date.now() - 1 * 86400000),
      notes: 'Test auditorium speakers, lapels, and boundary mics.',
      createdById: coreId,
      assignedToId: 'c4',
      completedAt: new Date(Date.now() - 1 * 86400000),
    },
    {
      id: 't3',
      name: 'Sponsorship outreach',
      category: Category.pre_event,
      priority: Priority.high,
      status: TaskStatus.in_progress,
      progress: 75,
      startDate: new Date(Date.now() - 15 * 86400000),
      dueDate: new Date(Date.now() + 4 * 86400000),
      notes: 'Target gold and platinum tiers. Follow up on signed contracts.',
      createdById: coreId,
      assignedToId: 'c5',
    },
    {
      id: 't4',
      name: 'Registration portal tech validation',
      category: Category.pre_event,
      priority: Priority.critical,
      status: TaskStatus.completed,
      progress: 100,
      startDate: new Date(Date.now() - 5 * 86400000),
      dueDate: new Date(Date.now() - 2 * 86400000),
      notes: 'Run load testing on register form submissions.',
      createdById: coreId,
      assignedToId: 'c2',
      completedAt: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: 't5',
      name: 'PR social media marketing rollout',
      category: Category.pre_event,
      priority: Priority.medium,
      status: TaskStatus.in_progress,
      progress: 40,
      startDate: new Date(Date.now() - 4 * 86400000),
      dueDate: new Date(Date.now() + 5 * 86400000),
      notes: 'Post countdown announcements daily on Instagram and LinkedIn.',
      createdById: coreId,
      assignedToId: 'c5',
    },
    {
      id: 't6',
      name: 'Stage decoration layout assembly',
      category: Category.pre_event,
      priority: Priority.medium,
      status: TaskStatus.assigned,
      progress: 0,
      startDate: new Date(Date.now() - 1 * 86400000),
      dueDate: new Date(Date.now() + 2 * 86400000),
      notes: 'Setup stage backdrop structure and spotlights alignment.',
      createdById: coreId,
      assignedToId: 'c7',
    },
    {
      id: 't7',
      name: 'Security personnel deployment briefing',
      category: Category.pre_event,
      priority: Priority.high,
      status: TaskStatus.yet_to_start,
      progress: 0,
      startDate: null,
      dueDate: new Date(Date.now() + 1 * 86400000),
      notes: 'Review emergency exits, metal detector checks, and gate entries.',
      createdById: coreId,
      assignedToId: 'c6',
    },
    {
      id: 't8',
      name: 'Auditorium seating layout checks',
      category: Category.pre_event,
      priority: Priority.low,
      status: TaskStatus.yet_to_start,
      progress: 0,
      startDate: null,
      dueDate: new Date(Date.now() + 3 * 86400000),
      notes: 'Row labeling and VIP card placements verification.',
      createdById: coreId,
      assignedToId: 'c4',
    },
    {
      id: 't9',
      name: 'Catering coordination',
      category: Category.during_event,
      priority: Priority.medium,
      status: TaskStatus.in_progress,
      progress: 60,
      startDate: new Date(Date.now() - 1 * 86400000),
      dueDate: new Date(Date.now() + 1 * 86400000),
      notes: 'Ensure lunch buffet setup starts by 12 PM in annex hall.',
      createdById: coreId,
      assignedToId: 'c4',
    },
    {
      id: 't10',
      name: 'Post-event survey analytics collection',
      category: Category.post_event,
      priority: Priority.low,
      status: TaskStatus.yet_to_start,
      progress: 0,
      startDate: null,
      dueDate: new Date(Date.now() + 8 * 86400000),
      notes: 'Send survey links to all registered delegates via email.',
      createdById: coreId,
      assignedToId: 'c3',
    },
    {
      id: 't11',
      name: 'Accounts settlement reports compilation',
      category: Category.post_event,
      priority: Priority.medium,
      status: TaskStatus.yet_to_start,
      progress: 0,
      startDate: null,
      dueDate: new Date(Date.now() + 10 * 86400000),
      notes: 'Verify invoice settlements and generate finance summary.',
      createdById: coreId,
      assignedToId: 'c2',
    },
    {
      id: 't12',
      name: 'Venue cleanup and handover clearance',
      category: Category.post_event,
      priority: Priority.low,
      status: TaskStatus.yet_to_start,
      progress: 0,
      startDate: null,
      dueDate: new Date(Date.now() + 12 * 86400000),
      notes: 'Check halls are cleared of garbage and return keys to college admin.',
      createdById: coreId,
      assignedToId: 'c4',
    },
  ];

  for (const task of tasksData) {
    await prisma.task.create({ data: task });
  }
  console.log(`Created ${tasksData.length} realistic tasks successfully.`);

  // 4. Create Comments
  const commentsData = [
    { taskId: 't1', userId: 'c1', message: 'First draft upload is ready. Sent preview link via email.' },
    { taskId: 't1', userId: coreId, message: 'Looks fantastic! Adjust contrast on footer logos.' },
    { taskId: 't1', userId: 'c1', message: 'Contrast issues corrected. Final vector exports shared.' },
    { taskId: 't3', userId: 'c5', message: 'Recieved signed agreement from TechCorp for Silver tier today.' },
    { taskId: 't3', userId: coreId, message: 'Excellent job. Try pitching the premium package to EduSoft next.' },
    { taskId: 't4', userId: 'c2', message: 'SSL certificates binding is completed. Registration load tests are looking stable.' },
    { taskId: 't9', userId: 'c4', message: 'Vendor catering desks are set. Plates and buffet cutlery are ready.' },
  ];

  for (const c of commentsData) {
    await prisma.comment.create({ data: c });
  }
  console.log(`Created ${commentsData.length} realistic comments.`);

  // 5. Create Progress Updates
  const progressUpdatesData = [
    { taskId: 't1', userId: 'c1', percentage: 50, comment: 'Draft layout designs completed' },
    { taskId: 't1', userId: 'c1', percentage: 100, comment: 'Contrast revisions cleared and final files sent' },
    { taskId: 't3', userId: 'c5', percentage: 20, comment: 'Prepared brochure deck' },
    { taskId: 't3', userId: 'c5', percentage: 50, comment: 'Gold sponsor confirmed' },
    { taskId: 't3', userId: 'c5', percentage: 75, comment: 'TechCorp silver sponsorship contract finalized' },
    { taskId: 't4', userId: 'c2', percentage: 100, comment: 'Load checks and server binding cleared' },
    { taskId: 't5', userId: 'c5', percentage: 40, comment: 'Daily PR calendars scheduled' },
    { taskId: 't9', userId: 'c4', percentage: 60, comment: 'Catering tables fully aligned' },
  ];

  for (const p of progressUpdatesData) {
    await prisma.progressUpdate.create({ data: p });
  }
  console.log(`Created ${progressUpdatesData.length} progress update entries.`);

  // 6. Create Activity Logs
  const activityLogsData = [
    { taskId: 't1', userId: coreId, action: ActivityAction.created, createdAt: new Date(Date.now() - 10 * 86400000) },
    { taskId: 't1', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c1' }, createdAt: new Date(Date.now() - 10 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.progress_updated, metadata: { previousProgress: 0, newProgress: 50, comment: 'Draft layout designs completed' }, createdAt: new Date(Date.now() - 8 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.comment_added, metadata: {}, createdAt: new Date(Date.now() - 7 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.progress_updated, metadata: { previousProgress: 50, newProgress: 100, comment: 'Contrast revisions cleared and final files sent' }, createdAt: new Date(Date.now() - 6 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.status_updated, metadata: { previousStatus: 'in_progress', newStatus: 'completed' }, createdAt: new Date(Date.now() - 6 * 86400000) },

    { taskId: 't2', userId: coreId, action: ActivityAction.created, createdAt: new Date(Date.now() - 2 * 86400000) },
    { taskId: 't2', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c4' }, createdAt: new Date(Date.now() - 2 * 86400000) },
    { taskId: 't2', userId: 'c4', action: ActivityAction.status_updated, metadata: { previousStatus: 'assigned', newStatus: 'completed' }, createdAt: new Date(Date.now() - 1 * 86400000) },

    { taskId: 't3', userId: coreId, action: ActivityAction.created, createdAt: new Date(Date.now() - 15 * 86400000) },
    { taskId: 't3', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c5' }, createdAt: new Date(Date.now() - 15 * 86400000) },
    { taskId: 't3', userId: 'c5', action: ActivityAction.progress_updated, metadata: { previousProgress: 0, newProgress: 20 }, createdAt: new Date(Date.now() - 12 * 86400000) },
    { taskId: 't3', userId: 'c5', action: ActivityAction.progress_updated, metadata: { previousProgress: 20, newProgress: 50 }, createdAt: new Date(Date.now() - 8 * 86400000) },
    { taskId: 't3', userId: 'c5', action: ActivityAction.progress_updated, metadata: { previousProgress: 50, newProgress: 75 }, createdAt: new Date(Date.now() - 4 * 86400000) },

    { taskId: 't6', userId: coreId, action: ActivityAction.created, createdAt: new Date(Date.now() - 1 * 86400000) },
    { taskId: 't6', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c7' }, createdAt: new Date(Date.now() - 1 * 86400000) },

    { taskId: 't9', userId: coreId, action: ActivityAction.created, createdAt: new Date(Date.now() - 1 * 86400000) },
    { taskId: 't9', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c4' }, createdAt: new Date(Date.now() - 1 * 86400000) },
    { taskId: 't9', userId: 'c4', action: ActivityAction.status_updated, metadata: { previousStatus: 'assigned', newStatus: 'in_progress' }, createdAt: new Date(Date.now() - 1 * 86400000) },
    { taskId: 't9', userId: 'c4', action: ActivityAction.progress_updated, metadata: { previousProgress: 0, newProgress: 60, comment: 'Catering tables fully aligned' }, createdAt: new Date(Date.now() - 12 * 3600000) },
  ];

  for (const a of activityLogsData) {
    await prisma.activityLog.create({ data: a });
  }
  console.log(`Created ${activityLogsData.length} activity timeline log entries.`);

  console.log('Seed Upgrade Complete!');
}

main()
  .catch((e) => {
    console.error('Upgraded seed script execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
