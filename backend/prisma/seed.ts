import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the local .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient, UserRole, Category, Priority, TaskStatus, ActivityAction, ReviewDecisionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Upgrading database seed to support Phase 1 Work Proof & Review Lifecycle...');
  console.log('Connecting to database...');

  // Clean existing tables (in order of dependencies)
  await prisma.reviewDecision.deleteMany();
  await prisma.workAttachment.deleteMany();
  await prisma.workUpdate.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.progressUpdate.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned all existing tables.');

  // 1. Create Core User
  const coreUser = await prisma.user.create({
    data: {
      id: 'core_admin',
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

  // 3. Create Tasks (with workflow lifecycle timestamps)
  const now = new Date();
  
  const tasksData = [
    {
      id: 't1',
      name: 'Design main poster and flyers',
      category: Category.pre_event,
      priority: Priority.low,
      status: TaskStatus.completed,
      progress: 100,
      startDate: new Date(now.getTime() - 10 * 86400000),
      dueDate: new Date(now.getTime() - 5 * 86400000),
      notes: 'Initial designs for visual promotions. Use approved brand styles.',
      createdById: coreId,
      assignedToId: 'c1',
      assignedAt: new Date(now.getTime() - 10 * 86400000),
      submittedAt: new Date(now.getTime() - 7 * 86400000),
      reviewedAt: new Date(now.getTime() - 6 * 86400000),
      completedAt: new Date(now.getTime() - 6 * 86400000),
    },
    {
      id: 't2',
      name: 'AV setup & sound checks',
      category: Category.during_event,
      priority: Priority.critical,
      status: TaskStatus.in_progress,
      progress: 50,
      startDate: new Date(now.getTime() - 2 * 86400000),
      dueDate: new Date(now.getTime() + 2 * 86400000),
      notes: 'Test auditorium speakers, lapels, and boundary mics.',
      createdById: coreId,
      assignedToId: 'c4',
      assignedAt: new Date(now.getTime() - 2 * 86400000),
    },
    {
      id: 't3',
      name: 'Sponsorship outreach',
      category: Category.pre_event,
      priority: Priority.high,
      status: TaskStatus.under_review,
      progress: 80,
      startDate: new Date(now.getTime() - 15 * 86400000),
      dueDate: new Date(now.getTime() + 4 * 86400000),
      notes: 'Target gold and platinum tiers. Follow up on signed contracts.',
      createdById: coreId,
      assignedToId: 'c5',
      assignedAt: new Date(now.getTime() - 15 * 86400000),
      submittedAt: new Date(now.getTime() - 1 * 86400000),
      reviewAssignedToId: 'core_admin',
      reviewAssignedAt: new Date(now.getTime() - 1 * 86400000),
    },
    {
      id: 't4',
      name: 'Registration portal tech validation',
      category: Category.pre_event,
      priority: Priority.critical,
      status: TaskStatus.blocked,
      progress: 60,
      startDate: new Date(now.getTime() - 5 * 86400000),
      dueDate: new Date(now.getTime() + 1 * 86400000),
      notes: 'Run load testing on register form submissions.',
      createdById: coreId,
      assignedToId: 'c2',
      assignedAt: new Date(now.getTime() - 5 * 86400000),
      submittedAt: new Date(now.getTime() - 3 * 86400000),
      reviewedAt: new Date(now.getTime() - 2 * 86400000),
    },
    {
      id: 't5',
      name: 'PR social media marketing rollout',
      category: Category.pre_event,
      priority: Priority.medium,
      status: TaskStatus.completed,
      progress: 100,
      startDate: new Date(now.getTime() - 14 * 86400000),
      dueDate: new Date(now.getTime() - 3 * 86400000),
      notes: 'Post countdown announcements daily on Instagram and LinkedIn.',
      createdById: coreId,
      assignedToId: 'c5',
      assignedAt: new Date(now.getTime() - 14 * 86400000),
      submittedAt: new Date(now.getTime() - 5 * 86400000),
      reviewedAt: new Date(now.getTime() - 4 * 86400000),
      completedAt: new Date(now.getTime() - 4 * 86400000),
      archivedAt: new Date(now.getTime() - 1 * 86400000), // Archived task (completed > 48h, now archived)
    },
    {
      id: 't6',
      name: 'Stage decoration layout assembly',
      category: Category.pre_event,
      priority: Priority.medium,
      status: TaskStatus.assigned,
      progress: 0,
      startDate: new Date(now.getTime() - 1 * 86400000),
      dueDate: new Date(now.getTime() + 2 * 86400000),
      notes: 'Setup stage backdrop structure and spotlights alignment.',
      createdById: coreId,
      assignedToId: 'c7',
      assignedAt: new Date(now.getTime() - 1 * 86400000),
    },
    {
      id: 't7',
      name: 'Security personnel deployment briefing',
      category: Category.pre_event,
      priority: Priority.high,
      status: TaskStatus.yet_to_start,
      progress: 0,
      startDate: null,
      dueDate: new Date(now.getTime() + 1 * 86400000),
      notes: 'Review emergency exits, metal detector checks, and gate entries.',
      createdById: coreId,
      assignedToId: 'c6',
      assignedAt: new Date(now.getTime() - 1 * 86400000),
    },
    {
      id: 't8',
      name: 'Auditorium seating layout checks',
      category: Category.pre_event,
      priority: Priority.low,
      status: TaskStatus.under_review,
      progress: 90,
      startDate: new Date(now.getTime() - 5 * 86400000),
      dueDate: new Date(now.getTime() + 3 * 86400000),
      notes: 'Row labeling and VIP card placements verification.',
      createdById: coreId,
      assignedToId: 'c1',
      assignedAt: new Date(now.getTime() - 5 * 86400000),
      submittedAt: new Date(now.getTime() - 12 * 3600000), // Submitted 12h ago
    },
  ];

  for (const task of tasksData) {
    await prisma.task.create({ data: task });
  }
  console.log(`Created ${tasksData.length} realistic tasks successfully.`);

  // 4. Create Work Updates (with revisions for task t8)
  
  // Task 3 Work Update (under review)
  const wuT3 = await prisma.workUpdate.create({
    data: {
      id: 'wu_t3_1',
      taskId: 't3',
      userId: 'c5',
      description: 'TechCorp sponsorship brochure and tier details updated. Gold confirmation attached.',
      progress: 80,
      revisionNumber: 1,
      createdAt: new Date(now.getTime() - 1 * 86400000),
    }
  });

  await prisma.workAttachment.create({
    data: {
      workUpdateId: wuT3.id,
      fileName: 'TechCorp_Gold_Sponsorship.pdf',
      fileUrl: '/uploads/tasks/TechCorp_Gold_Sponsorship.pdf',
      fileType: 'application/pdf',
      fileSize: 1250000,
    }
  });

  // Task 4 Work Update (Changes Requested after submission)
  const wuT4 = await prisma.workUpdate.create({
    data: {
      id: 'wu_t4_1',
      taskId: 't4',
      userId: 'c2',
      description: 'Configured SSL and loaded portal test script. Ready for check.',
      progress: 60,
      revisionNumber: 1,
      createdAt: new Date(now.getTime() - 3 * 86400000),
    }
  });

  await prisma.workAttachment.create({
    data: {
      workUpdateId: wuT4.id,
      fileName: 'load_test_results.pdf',
      fileUrl: '/uploads/tasks/load_test_results.pdf',
      fileType: 'application/pdf',
      fileSize: 3400000,
    }
  });

  // Task 8 Work Updates - Multiple Revisions (Revision 1, 2, and 3)
  // Revision 1 (Changes Requested)
  const wuT8Rev1 = await prisma.workUpdate.create({
    data: {
      id: 'wu_t8_rev1',
      taskId: 't8',
      userId: 'c1',
      description: 'Auditorium layout draft 1 with label positioning draft.',
      progress: 30,
      revisionNumber: 1,
      createdAt: new Date(now.getTime() - 4 * 86400000),
    }
  });

  await prisma.workAttachment.create({
    data: {
      workUpdateId: wuT8Rev1.id,
      fileName: 'auditorium_draft_v1.png',
      fileUrl: '/uploads/tasks/auditorium_draft_v1.png',
      fileType: 'image/png',
      fileSize: 450000,
    }
  });

  // Revision 2 (Changes Requested)
  const wuT8Rev2 = await prisma.workUpdate.create({
    data: {
      id: 'wu_t8_rev2',
      taskId: 't8',
      userId: 'c1',
      description: 'Refined labels and VIP card alignments according to manager directions.',
      progress: 60,
      revisionNumber: 2,
      createdAt: new Date(now.getTime() - 2 * 86400000),
    }
  });

  await prisma.workAttachment.create({
    data: {
      workUpdateId: wuT8Rev2.id,
      fileName: 'auditorium_draft_v2.png',
      fileUrl: '/uploads/tasks/auditorium_draft_v2.png',
      fileType: 'image/png',
      fileSize: 520000,
    }
  });

  // Revision 3 (Under Review)
  const wuT8Rev3 = await prisma.workUpdate.create({
    data: {
      id: 'wu_t8_rev3',
      taskId: 't8',
      userId: 'c1',
      description: 'Final seating check with 240 VIP placards printed and layout validated.',
      progress: 90,
      revisionNumber: 3,
      createdAt: new Date(now.getTime() - 12 * 3600000),
    }
  });

  await prisma.workAttachment.create({
    data: {
      workUpdateId: wuT8Rev3.id,
      fileName: 'auditorium_final_layout.png',
      fileUrl: '/uploads/tasks/auditorium_final_layout.png',
      fileType: 'image/png',
      fileSize: 620000,
    }
  });

  await prisma.workAttachment.create({
    data: {
      workUpdateId: wuT8Rev3.id,
      fileName: 'vip_placements_sheet.xlsx',
      fileUrl: '/uploads/tasks/vip_placements_sheet.xlsx',
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 150000,
    }
  });

  console.log('Created work updates and attachments successfully.');

  // 5. Create Review Decisions
  
  // Review Decision for Task 4 (Changes Requested)
  await prisma.reviewDecision.create({
    data: {
      id: 'rd_t4_1',
      taskId: 't4',
      reviewerId: 'core_admin',
      workUpdateId: wuT4.id,
      decision: ReviewDecisionType.changes_requested,
      comment: 'The script works but fails on concurrent connections > 50. Please patch this configuration issue.',
      createdAt: new Date(now.getTime() - 2 * 86400000),
    }
  });

  // Review Decisions for Task 8 Revisions
  // Rev 1 Rejected
  await prisma.reviewDecision.create({
    data: {
      id: 'rd_t8_rev1',
      taskId: 't8',
      reviewerId: 'core_admin',
      workUpdateId: wuT8Rev1.id,
      decision: ReviewDecisionType.changes_requested,
      comment: 'Row labels from H-M are not clearly aligned. Please revise.',
      createdAt: new Date(now.getTime() - 3 * 86400000),
    }
  });

  // Rev 2 Rejected
  await prisma.reviewDecision.create({
    data: {
      id: 'rd_t8_rev2',
      taskId: 't8',
      reviewerId: 'core_admin',
      workUpdateId: wuT8Rev2.id,
      decision: ReviewDecisionType.changes_requested,
      comment: 'VIP placard sizes are larger than standard parameters. Shrink to 4x6.',
      createdAt: new Date(now.getTime() - 1.5 * 86400000),
    }
  });

  console.log('Created review decision history.');

  // 6. Create Comments
  const commentsData = [
    { taskId: 't1', userId: 'c1', message: 'First draft upload is ready. Sent preview link via email.' },
    { taskId: 't1', userId: coreId, message: 'Looks fantastic! Adjust contrast on footer logos.' },
    { taskId: 't3', userId: 'c5', message: 'Ready to submit the brochure details.' },
    { taskId: 't8', userId: 'c1', message: 'Working on seating arrangements. Should be done shortly.' },
  ];

  for (const c of commentsData) {
    await prisma.comment.create({ data: c });
  }
  console.log(`Created ${commentsData.length} comments.`);

  // 7. Create Progress Updates (for backwards compatibility)
  const progressUpdatesData = [
    { taskId: 't1', userId: 'c1', percentage: 50, comment: 'Draft layout designs completed' },
    { taskId: 't1', userId: 'c1', percentage: 100, comment: 'Contrast revisions cleared and final files sent' },
    { taskId: 't8', userId: 'c1', percentage: 30, comment: 'Revision 1 submitted' },
    { taskId: 't8', userId: 'c1', percentage: 60, comment: 'Revision 2 submitted' },
  ];

  for (const p of progressUpdatesData) {
    await prisma.progressUpdate.create({ data: p });
  }
  console.log(`Created ${progressUpdatesData.length} progress update entries.`);

  // 8. Create Activity Logs (using extended enum actions)
  const activityLogsData = [
    // t1 Activity Logs
    { taskId: 't1', userId: coreId, action: ActivityAction.created, createdAt: new Date(now.getTime() - 10 * 86400000) },
    { taskId: 't1', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c1' }, createdAt: new Date(now.getTime() - 10 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.progress_updated, metadata: { previousProgress: 0, newProgress: 50, comment: 'Draft layout designs completed' }, createdAt: new Date(now.getTime() - 8 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.comment_added, metadata: {}, createdAt: new Date(now.getTime() - 7 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.work_submitted, metadata: { progress: 100 }, createdAt: new Date(now.getTime() - 7 * 86400000) },
    { taskId: 't1', userId: coreId, action: ActivityAction.review_approved, metadata: { comment: 'Contrast revisions cleared and final files sent' }, createdAt: new Date(now.getTime() - 6 * 86400000) },
    { taskId: 't1', userId: 'c1', action: ActivityAction.status_updated, metadata: { previousStatus: 'under_review', newStatus: 'completed' }, createdAt: new Date(now.getTime() - 6 * 86400000) },

    // t3 Activity Logs
    { taskId: 't3', userId: coreId, action: ActivityAction.created, createdAt: new Date(now.getTime() - 15 * 86400000) },
    { taskId: 't3', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c5' }, createdAt: new Date(now.getTime() - 15 * 86400000) },
    { taskId: 't3', userId: 'c5', action: ActivityAction.work_submitted, metadata: { progress: 80 }, createdAt: new Date(now.getTime() - 1 * 86400000) },
    { taskId: 't3', userId: 'c5', action: ActivityAction.attachment_added, metadata: { fileName: 'TechCorp_Gold_Sponsorship.pdf' }, createdAt: new Date(now.getTime() - 1 * 86400000) },

    // t4 Activity Logs
    { taskId: 't4', userId: coreId, action: ActivityAction.created, createdAt: new Date(now.getTime() - 5 * 86400000) },
    { taskId: 't4', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c2' }, createdAt: new Date(now.getTime() - 5 * 86400000) },
    { taskId: 't4', userId: 'c2', action: ActivityAction.work_submitted, metadata: { progress: 60 }, createdAt: new Date(now.getTime() - 3 * 86400000) },
    { taskId: 't4', userId: coreId, action: ActivityAction.review_changes_requested, metadata: { comment: 'The script works but fails on concurrent connections > 50.' }, createdAt: new Date(now.getTime() - 2 * 86400000) },

    // t5 Activity Logs (Archived Task)
    { taskId: 't5', userId: coreId, action: ActivityAction.created, createdAt: new Date(now.getTime() - 14 * 86400000) },
    { taskId: 't5', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c5' }, createdAt: new Date(now.getTime() - 14 * 86400000) },
    { taskId: 't5', userId: 'c5', action: ActivityAction.work_submitted, metadata: { progress: 100 }, createdAt: new Date(now.getTime() - 5 * 86400000) },
    { taskId: 't5', userId: coreId, action: ActivityAction.review_approved, metadata: {}, createdAt: new Date(now.getTime() - 4 * 86400000) },
    { taskId: 't5', userId: coreId, action: ActivityAction.archived, metadata: {}, createdAt: new Date(now.getTime() - 1 * 86400000) },

    // t8 Activity Logs
    { taskId: 't8', userId: coreId, action: ActivityAction.created, createdAt: new Date(now.getTime() - 5 * 86400000) },
    { taskId: 't8', userId: coreId, action: ActivityAction.assigned, metadata: { newAssigneeId: 'c1' }, createdAt: new Date(now.getTime() - 5 * 86400000) },
    { taskId: 't8', userId: 'c1', action: ActivityAction.work_submitted, metadata: { progress: 30, revisionNumber: 1 }, createdAt: new Date(now.getTime() - 4 * 86400000) },
    { taskId: 't8', userId: coreId, action: ActivityAction.review_changes_requested, metadata: { comment: 'Row labels from H-M are not clearly aligned.' }, createdAt: new Date(now.getTime() - 3 * 86400000) },
    { taskId: 't8', userId: 'c1', action: ActivityAction.work_submitted, metadata: { progress: 60, revisionNumber: 2 }, createdAt: new Date(now.getTime() - 2 * 86400000) },
    { taskId: 't8', userId: coreId, action: ActivityAction.review_changes_requested, metadata: { comment: 'VIP placard sizes are larger than standard.' }, createdAt: new Date(now.getTime() - 1.5 * 86400000) },
    { taskId: 't8', userId: 'c1', action: ActivityAction.work_submitted, metadata: { progress: 90, revisionNumber: 3 }, createdAt: new Date(now.getTime() - 12 * 3600000) },
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
