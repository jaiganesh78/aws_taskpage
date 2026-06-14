'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn, formatDateRelative, getInitials } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface RecentlyCompletedProps {
  tasks: Task[];
}

export function RecentlyCompleted({ tasks }: RecentlyCompletedProps) {
  const recent = tasks
    .filter(t => t.status === 'completed' && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5);

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <CheckCircle2 size={14} className="text-success" />
        Recently Completed
      </h3>
      <div className="space-y-2">
        {recent.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-aws-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-success/8 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={14} className="text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-aws-slate truncate block">{task.name}</span>
              {task.assignedTo && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-4 h-4 rounded-full gradient-slate flex items-center justify-center text-[6px] font-bold text-white">
                    {getInitials(task.assignedTo.name)}
                  </div>
                  <span className="text-xs text-aws-gray-500">{task.assignedTo.name}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-aws-gray-500 flex-shrink-0">
              {formatDateRelative(task.completedAt || task.dueDate)}
            </span>
          </motion.div>
        ))}
        {recent.length === 0 && (
          <p className="text-sm text-aws-gray-400 text-center py-4">No completed tasks</p>
        )}
      </div>
    </GlassCard>
  );
}
