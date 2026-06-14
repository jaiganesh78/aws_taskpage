'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn, getInitials } from '@/lib/utils';
import type { CrewMember, Task } from '@/lib/types';
import { BarChart3 } from 'lucide-react';

interface CrewContributionProps {
  members: CrewMember[];
  tasks: Task[];
}

export function CrewContribution({ members, tasks }: CrewContributionProps) {
  const taskCounts: Record<string, { assigned: number; completed: number }> = {};
  tasks.forEach(t => {
    if (t.assignedTo) {
      if (!taskCounts[t.assignedTo.id]) taskCounts[t.assignedTo.id] = { assigned: 0, completed: 0 };
      taskCounts[t.assignedTo.id].assigned++;
      if (t.status === 'completed') taskCounts[t.assignedTo.id].completed++;
    }
  });

  const data = members
    .map(m => ({
      ...m,
      assigned: taskCounts[m.id]?.assigned || 0,
      completed: taskCounts[m.id]?.completed || 0,
      percentage: taskCounts[m.id]?.assigned
        ? (taskCounts[m.id].completed / taskCounts[m.id].assigned) * 100
        : 0,
    }))
    .filter(d => d.assigned > 0)
    .sort((a, b) => b.completed - a.completed);

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-4 flex items-center gap-2">
        <BarChart3 size={16} className="text-aws-orange" />
        Crew Contribution Overview
      </h3>
      <div className="space-y-3">
        {data.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-8 h-8 rounded-full gradient-slate flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {getInitials(member.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-aws-slate">{member.name}</span>
                  <span className="text-xs text-aws-gray-500">
                    {member.completed}/{member.assigned} done
                  </span>
                </div>
              </div>
            </div>
            <ProgressBar value={member.percentage} size="sm" showLabel />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
