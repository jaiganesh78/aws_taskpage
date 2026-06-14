'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { isOverdue, getInitials } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { ClockAlert, ChevronRight } from 'lucide-react';

interface OverdueTasksProps {
  tasks: Task[];
}

export function OverdueTasks({ tasks }: OverdueTasksProps) {
  const overdue = tasks
    .filter(t => isOverdue(t.dueDate) && t.status !== 'completed')
    .slice(0, 5);

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <ClockAlert size={14} className="text-error" />
        Overdue Tasks
        {overdue.length > 0 && (
          <span className="text-xs bg-error/10 text-error font-medium px-2 py-0.5 rounded-full">
            {overdue.length}
          </span>
        )}
      </h3>
      <div className="space-y-2">
        {overdue.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-error/[0.02] transition-colors group border-l-2 border-l-error/30"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-aws-slate truncate">{task.name}</span>
                <PriorityBadge priority={task.priority} />
              </div>
              {task.assignedTo && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-4 h-4 rounded-full gradient-slate flex items-center justify-center text-[6px] font-bold text-white">
                    {getInitials(task.assignedTo.name)}
                  </div>
                  <span className="text-xs text-aws-gray-500">{task.assignedTo.name}</span>
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-error flex-shrink-0">Overdue</span>
          </motion.div>
        ))}
        {overdue.length === 0 && (
          <p className="text-sm text-aws-gray-400 text-center py-4">No overdue tasks</p>
        )}
      </div>
    </GlassCard>
  );
}
