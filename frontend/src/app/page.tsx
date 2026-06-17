'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { TaskDetailsModal } from '@/components/dashboard/TaskDetailsModal';
import { useUser } from '@/lib/user-context';
import { api } from '@/lib/api';
import type { Task, TaskStatus, TaskCategory, Priority } from '@/lib/types';
import { UserCheck, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, users, isLoading: userContextLoading } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<{
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueTasks: number;
    completionRate: number;
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const isCore = currentUser?.role === 'core';

  const fetchData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      if (currentUser.role === 'core') {
        const [tasksRes, summaryRes] = await Promise.all([
          api.getTasks({ limit: 100 }),
          api.getDashboardSummary(),
        ]);
        setTasks(tasksRes.data);
        setSummary(summaryRes);
      } else {
        const tasksRes = await api.getTasks({ assigneeId: currentUser.id, limit: 100 });
        setTasks(tasksRes.data);
        setSummary(null);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const activeCrew = useMemo(() => {
    return users.filter(u => u.role === 'crew' && u.isActive);
  }, [users]);

  const stats = useMemo(() => {
    if (isCore && summary) {
      return {
        assigned: tasks.filter(t => t.assignedTo !== null).length,
        completed: summary.completedTasks,
        pending: summary.activeTasks,
      };
    } else {
      return {
        assigned: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status !== 'completed').length,
      };
    }
  }, [isCore, summary, tasks]);

  const handleAssign = async (data: {
    taskName: string;
    category: TaskCategory;
    priority: Priority;
    assignedTo: any;
    startDate: string;
    dueDate: string;
    notes: string;
  }) => {
    try {
      await api.createTask({
        name: data.taskName,
        category: data.category,
        priority: data.priority,
        assignedToId: data.assignedTo.id,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
      });
      fetchData();
    } catch (err) {
      // Error message is dispatched to context toast automatically
    }
  };

  const handleStatusUpdate = async (taskId: string, status: TaskStatus) => {
    try {
      await api.updateTaskStatus(taskId, status);
      fetchData();
    } catch (err) {
      // Error is dispatched automatically
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      fetchData();
    } catch (err) {
      // Error is dispatched automatically
    }
  };

  if (userContextLoading || (isLoadingData && tasks.length === 0)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-aws-gray-500 font-semibold">Loading dashboard metrics...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Header
          title={isCore ? "Task Assignment Dashboard" : "My Task Dashboard"}
          subtitle={isCore ? "Core Team Operations — AWS SBG REC" : "Your Assigned Work & Status — AWS SBG REC"}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-2.5"
        >
          <StatCard
            label={isCore ? "Assigned Tasks" : "My Tasks"}
            value={stats.assigned}
            icon={<UserCheck size={16} />}
            color="info"
          />
          <StatCard
            label="Completed Tasks"
            value={stats.completed}
            icon={<CheckCircle2 size={16} />}
            color="success"
          />
          <StatCard
            label="Pending Tasks"
            value={stats.pending}
            icon={<Clock size={16} />}
            color="warning"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            {isCore && <TaskAssignmentForm onAssign={handleAssign} />}
            <OverdueTasks tasks={tasks} />
            {isCore && <CrewAvailability members={activeCrew} tasks={tasks} />}
          </div>
          <UpcomingDeadlines tasks={tasks} />
        </div>

        <SectionHeader
          title={isCore ? "All Tasks" : "My Assigned Tasks"}
          subtitle={isCore ? "Manage, filter, and update task assignments" : "Track status, review notes, and check progress"}
        />

        <TaskTable
          tasks={tasks}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          isCore={isCore}
          onRowClick={(task) => setSelectedTaskId(task.id)}
        />
      </div>

      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchData}
        />
      )}
    </DashboardLayout>
  );
}
