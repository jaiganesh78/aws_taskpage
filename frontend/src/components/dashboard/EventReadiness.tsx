'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Task, TaskCategory } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { Target, ChevronRight } from 'lucide-react';

interface EventReadinessProps {
  tasks: Task[];
}

export function EventReadiness({ tasks }: EventReadinessProps) {
  const categories: TaskCategory[] = ['pre_event', 'during_event', 'post_event'];

  const getCategoryProgress = (cat: TaskCategory) => {
    const catTasks = tasks.filter(t => t.category === cat);
    if (catTasks.length === 0) return 0;
    return catTasks.reduce((sum, t) => sum + t.progress, 0) / catTasks.length;
  };

  const totalProgress = tasks.length > 0
    ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
    : 0;

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <Target size={14} className="text-aws-orange" />
        Event Readiness
      </h3>
      <div className="space-y-3">
        <div className="text-center py-2">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-3xl font-bold text-aws-slate"
          >
            {Math.round(totalProgress)}%
          </motion.div>
          <div className="text-xs text-aws-gray-500 mt-0.5">Overall Readiness</div>
        </div>
        {categories.map(cat => {
          const progress = getCategoryProgress(cat);
          const label = CATEGORIES.find(c => c.value === cat)?.label || cat;
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-aws-gray-600">{label}</span>
                <span className="text-xs font-semibold text-aws-gray-600">{Math.round(progress)}%</span>
              </div>
              <ProgressBar value={progress} size="sm" />
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
