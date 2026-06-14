'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TaskAssignmentForm } from '@/components/dashboard/TaskAssignmentForm';
import { TaskTable } from '@/components/dashboard/TaskTable';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { HighPriorityTasks } from '@/components/dashboard/HighPriorityTasks';
import { OverdueTasks } from '@/components/dashboard/OverdueTasks';
import { RecentlyCompleted } from '@/components/dashboard/RecentlyCompleted';
import { CrewAvailability } from '@/components/dashboard/CrewAvailability';
import { EventReadiness } from '@/components/dashboard/EventReadiness';
import { tasks as initialTasks, crewMembers, events } from '@/lib/mockData';
import type { Task, TaskStatus, TaskCategory, Priority, CrewMember } from '@/lib/types';
import {
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';

export default function CoreDashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = useMemo(() => ({
    total: tasks.length,
    assigned: tasks.filter(t => t.assignedTo !== null).length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    completionRate: tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0,
  }), [tasks]);

  const handleAssign = (data: {
    taskName: string;
    category: TaskCategory;
    priority: Priority;
    assignedTo: CrewMember;
    dueDate: string;
    notes: string;
  }) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      name: data.taskName,
      category: data.category,
      priority: data.priority,
      status: 'assigned',
      assignedTo: data.assignedTo,
      assignedBy: crewMembers[5],
      dueDate: new Date(data.dueDate).toISOString(),
      notes: data.notes,
      completionPercentage: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setRefreshKey(k => k + 1);
  };

  const handleStatusUpdate = (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? {
            ...t,
            status,
            completionPercentage: status === 'completed' ? 100 : t.completionPercentage,
            completedAt: status === 'completed' ? new Date().toISOString() : t.completedAt,
            updatedAt: new Date().toISOString(),
          }
        : t,
    ));
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setRefreshKey(k => k + 1);
  };

  const handleProgressUpdate = (taskId: string, progress: number) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? {
            ...t,
            completionPercentage: progress,
            status: progress === 100 ? 'completed' :
                    progress > 0 && t.status === 'yet_to_start' ? 'in_progress' :
                    t.status,
            completedAt: progress === 100 ? new Date().toISOString() : t.completedAt,
            updatedAt: new Date().toISOString(),
          }
        : t,
    ));
    setRefreshKey(k => k + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Task Assignment Dashboard"
          subtitle="Core Team Operations — AWS SBG REC"
          eventName={events[0].name}
          eventStatus={events[0].status}
        />

        <motion.div
          key={`stats-${refreshKey}`}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <StatCard
            label="Total Tasks"
            value={stats.total}
            icon={<ClipboardList size={16} />}
            color="slate"
          />
          <StatCard
            label="Assigned"
            value={stats.assigned}
            icon={<UserCheck size={16} />}
            color="info"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={<CheckCircle2 size={16} />}
            color="success"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<Clock size={16} />}
            color="warning"
          />
          <StatCard
            label="Completion Rate"
            value={stats.completionRate}
            suffix="%"
            icon={<TrendingUp size={16} />}
            color="orange"
            className="col-span-2 lg:col-span-1"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <TaskAssignmentForm onAssign={handleAssign} />
          <div className="space-y-4">
            <UpcomingDeadlines tasks={tasks} />
            <EventReadiness tasks={tasks} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HighPriorityTasks tasks={tasks} />
          <OverdueTasks tasks={tasks} />
          <RecentlyCompleted tasks={tasks} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CrewAvailability members={crewMembers} tasks={tasks} />
          </div>
        </div>

        <SectionHeader
          title="All Tasks"
          subtitle="Manage, filter, and update task assignments"
        />

        <TaskTable
          tasks={tasks}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>
    </DashboardLayout>
  );
}
