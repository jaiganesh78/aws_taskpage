'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn, getInitials } from '@/lib/utils';
import type { CrewMember, Task } from '@/lib/types';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardProps {
  members: CrewMember[];
  tasks: Task[];
}

export function Leaderboard({ members, tasks }: LeaderboardProps) {
  const taskCounts: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.assignedTo && t.status === 'completed') {
      taskCounts[t.assignedTo.id] = (taskCounts[t.assignedTo.id] || 0) + 1;
    }
  });

  const ranked = members
    .map(m => ({
      ...m,
      completed: taskCounts[m.id] || 0,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  const rankIcons = [
    <Trophy key={1} size={16} className="text-warning" />,
    <Medal key={2} size={16} className="text-aws-gray-400" />,
    <Award key={3} size={16} className="text-aws-orange" />,
  ];

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-aws-orange" />
        Top Contributors
      </h3>
      <div className="space-y-2">
        {ranked.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl transition-all',
              i === 0 ? 'bg-aws-orange/[0.04] border border-aws-orange/10' : 'hover:bg-aws-gray-50',
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
              i === 0 ? 'gradient-orange text-white shadow-lg shadow-aws-orange/20' :
              i === 1 ? 'bg-aws-gray-200 text-aws-gray-600' :
              i === 2 ? 'bg-aws-orange/10 text-aws-orange' :
              'bg-aws-gray-100 text-aws-gray-500',
            )}>
              {getInitials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-aws-slate">{member.name}</span>
                {i < 3 && (
                  <span className="text-xs">{rankIcons[i]}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-aws-slate">{member.completed}</div>
              <div className="text-[10px] text-aws-gray-500">completed</div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
