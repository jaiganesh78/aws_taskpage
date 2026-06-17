'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn, getInitials } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface HighPriorityTasksProps {
  tasks: Task[];
}

export function HighPriorityTasks({ tasks }: HighPriorityTasksProps) {
  const highPriority = tasks
    .filter(t => (t.priority === 'high' || t.priority === 'critical') && t.status !== 'completed')
    .slice(0, 5);

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <AlertTriangle size={14} className="text-error" />
        High Priority Tasks
      </h3>
      <div className="space-y-2">
        {highPriority.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-2.5 rounded-lg hover:bg-aws-gray-50 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  task.priority === 'critical' ? 'bg-error' : 'bg-aws-orange',
                )} />
                <span className="text-sm font-medium text-aws-slate truncate">{task.name}</span>
              </div>
              <StatusBadge status={task.status} />
            </div>
            <div className="flex items-center justify-between ml-3.5">
              {task.assignedTo ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full gradient-slate flex items-center justify-center text-[6px] font-bold text-white">
                    {getInitials(task.assignedTo.name)}
                  </div>
                  <span className="text-xs text-aws-gray-500">{task.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-xs text-aws-gray-400 italic">Unassigned</span>
              )}
            </div>
            <div className="mt-1.5 ml-3.5">
              <ProgressBar value={task.progress} size="sm" />
            </div>
          </motion.div>
        ))}
        {highPriority.length === 0 && (
          <p className="text-sm text-aws-gray-400 text-center py-4">No high priority tasks</p>
        )}
      </div>
    </GlassCard>
  );
}
