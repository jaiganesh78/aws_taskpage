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

import { OverdueTasks } from '@/components/dashboard/OverdueTasks';
import { CrewAvailability } from '@/components/dashboard/CrewAvailability';
import { tasks as initialTasks, crewMembers } from '@/lib/mockData';

import type { Task, TaskStatus, TaskCategory, Priority, CrewMember } from '@/lib/types';
import { UserCheck, CheckCircle2, Clock } from 'lucide-react';

export default function CoreDashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = useMemo(() => ({
    assigned: tasks.filter(t => t.assignedTo !== null).length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status !== 'completed').length,
  }), [tasks]);

  const handleAssign = (data: {
    taskName: string;
    category: TaskCategory;
    priority: Priority;
    assignedTo: CrewMember;
    startDate: string;
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
      startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
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

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Header
          title="Task Assignment Dashboard"
          subtitle="Core Team Operations — AWS SBG REC"
        />

        <motion.div
          key={`stats-${refreshKey}`}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-2.5"
        >
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <TaskAssignmentForm onAssign={handleAssign} />
            <OverdueTasks tasks={tasks} />
            <CrewAvailability members={crewMembers} tasks={tasks} />
          </div>
          <UpcomingDeadlines tasks={tasks} />
        </div>

        <SectionHeader
          title="All Tasks"
          subtitle="Manage, filter, and update task assignments"
        />

        <TaskTable
          tasks={tasks}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
