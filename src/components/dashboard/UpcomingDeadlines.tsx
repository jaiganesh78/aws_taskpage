'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatDateRelative, getInitials } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { Calendar, ChevronRight, ArrowUpRight } from 'lucide-react';

interface UpcomingDeadlinesProps {
  tasks: Task[];
}

export function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
  const allUpcoming = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const visible = allUpcoming.slice(0, 2);
  const remaining = allUpcoming.length - visible.length;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-aws-slate flex items-center gap-2">
          <Calendar size={14} className="text-aws-orange" />
          Upcoming Deadlines
        </h3>
        {allUpcoming.length > 0 && (
          <span className="text-xs bg-aws-orange/8 text-aws-orange font-medium px-2 py-0.5 rounded-full">
            {allUpcoming.length}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {visible.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-aws-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-aws-orange/8 flex items-center justify-center flex-shrink-0">
              <Calendar size={14} className="text-aws-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-aws-slate leading-snug truncate">{task.name}</span>
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
            <div className="text-right flex-shrink-0 whitespace-nowrap">
              <span className={cn(
                'text-xs font-medium',
                formatDateRelative(task.dueDate).includes('overdue') ? 'text-error' : 'text-aws-gray-600',
              )}>
                {formatDateRelative(task.dueDate)}
              </span>
            </div>
          </motion.div>
        ))}
        {remaining > 0 && (
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-aws-orange hover:text-aws-orange-dark hover:bg-aws-orange/5 rounded-lg transition-all"
          >
            View All ({remaining} more)
            <ArrowUpRight size={12} />
          </button>
        )}
      </div>
    </GlassCard>
  );
}
