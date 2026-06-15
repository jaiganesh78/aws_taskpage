'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatDateRelative, getInitials } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { Calendar, ChevronRight } from 'lucide-react';

interface UpcomingDeadlinesProps {
  tasks: Task[];
}

export function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
  const upcoming = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <GlassCard className="h-full">
      <h3 className="text-sm font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <Calendar size={14} className="text-aws-orange" />
        Upcoming Deadlines
      </h3>
      <div className="space-y-2">
        {upcoming.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-aws-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-aws-orange/8 flex items-center justify-center flex-shrink-0">
              <Calendar size={14} className="text-aws-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-sm font-medium text-aws-slate leading-snug">{task.name}</span>
                <StatusBadge status={task.status} />
              </div>
              {task.assignedTo && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-4 h-4 rounded-full gradient-slate flex items-center justify-center text-[6px] font-bold text-white flex-shrink-0">
                    {getInitials(task.assignedTo.name)}
                  </div>
                  <span className="text-xs text-aws-gray-500 truncate">{task.assignedTo.name}</span>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <span className={cn(
                'text-xs font-medium block',
                formatDateRelative(task.dueDate).includes('overdue') ? 'text-error' : 'text-aws-gray-600',
              )}>
                {formatDateRelative(task.dueDate)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
