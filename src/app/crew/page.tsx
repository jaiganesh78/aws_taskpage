'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CrewTaskCard } from '@/components/crew/CrewTaskCard';
import { tasks as initialTasks } from '@/lib/mockData';
import type { Task, TaskStatus } from '@/lib/types';
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const CURRENT_USER_ID = 'c5';

export default function CrewDashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'all' | 'week' | 'priority'>('all');

  const myTasks = useMemo(() =>
    tasks.filter(t => t.assignedTo?.id === CURRENT_USER_ID),
  [tasks]);

  const stats = useMemo(() => ({
    total: myTasks.length,
    completed: myTasks.filter(t => t.status === 'completed').length,
    pending: myTasks.filter(t => t.status !== 'completed').length,
  }), [myTasks]);

  const dueThisWeek = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return myTasks.filter(t => {
      const d = new Date(t.dueDate);
      return d >= now && d <= weekEnd && t.status !== 'completed';
    });
  }, [myTasks]);

  const priorityTasks = useMemo(() =>
    myTasks.filter(t => (t.priority === 'high' || t.priority === 'critical') && t.status !== 'completed'),
  [myTasks]);

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
  };

  const displayTasks = filter === 'week' ? dueThisWeek
    : filter === 'priority' ? priorityTasks
    : myTasks;

  const tabs = [
    { key: 'all' as const, label: 'My Tasks', count: myTasks.length },
    { key: 'week' as const, label: 'Due This Week', count: dueThisWeek.length },
    { key: 'priority' as const, label: 'Priority', count: priorityTasks.length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Crew Task Dashboard"
          subtitle="Your assigned tasks and deadlines — AWS SBG REC"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-3"
        >
          <StatCard label="My Tasks" value={stats.total} icon={<ClipboardList size={16} />} color="slate" />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={16} />} color="success" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock size={16} />} color="warning" />
        </motion.div>

        {/* Main task list — full width */}
        <GlassCard>
          <SectionHeader
            title="My Tasks"
            subtitle={`${myTasks.filter(t => t.status === 'completed').length} of ${myTasks.length} completed`}
          />

          <div className="flex gap-2 mb-4 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all border',
                  filter === tab.key
                    ? 'bg-aws-orange/8 border-aws-orange/30 text-aws-orange'
                    : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300',
                )}
              >
                {tab.label}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  filter === tab.key ? 'bg-aws-orange/15 text-aws-orange' : 'bg-aws-gray-100 text-aws-gray-500',
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayTasks.length > 0 ? (
              displayTasks.map(task => (
                <CrewTaskCard
                    key={task.id}
                    task={task}
                    onStatusUpdate={handleStatusUpdate}
                  />
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-aws-gray-400 text-sm">
                No tasks in this view
              </div>
            )}
          </div>
        </GlassCard>


      </div>
    </DashboardLayout>
  );
}
