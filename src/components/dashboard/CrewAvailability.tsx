'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn, getInitials } from '@/lib/utils';
import type { CrewMember, Task } from '@/lib/types';
import { Users, CheckCircle2 } from 'lucide-react';

interface CrewAvailabilityProps {
  members: CrewMember[];
  tasks: Task[];
}

export function CrewAvailability({ members, tasks }: CrewAvailabilityProps) {
  // Calculate per-member stats from actual task data
  const memberStats: Record<string, { completed: number; total: number }> = {};
  tasks.forEach(t => {
    if (t.assignedTo) {
      const id = t.assignedTo.id;
      if (!memberStats[id]) memberStats[id] = { completed: 0, total: 0 };
      memberStats[id].total += 1;
      if (t.status === 'completed') memberStats[id].completed += 1;
    }
  });

  const sorted = [...members]
    .map(m => {
      const stats = memberStats[m.id] || { completed: 0, total: 0 };
      const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      return { ...m, completed: stats.completed, total: stats.total, rate };
    })
    // Sort: highest completion rate first (most available)
    .sort((a, b) => b.rate - a.rate || b.completed - a.completed);

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <Users size={14} className="text-aws-orange" />
        Crew Availability
      </h3>
      <div className="space-y-3">
        {sorted.map((member, i) => {
          const barColor = member.rate >= 80 ? '#10B981' : member.rate >= 50 ? '#F59E0B' : '#EF4444';
          const bgColor = member.rate >= 80 ? 'rgba(16,185,129,0.08)' : member.rate >= 50 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
          const isFullyDone = member.total > 0 && member.completed === member.total;
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-xl"
              style={{ background: isFullyDone ? 'rgba(16,185,129,0.04)' : 'transparent' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #232F3E 0%, #3d4f63 100%)' }}
              >
                {getInitials(member.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-aws-slate truncate">{member.name}</span>
                    {isFullyDone && (
                      <CheckCircle2 size={11} style={{ color: '#10B981', flexShrink: 0 }} />
                    )}
                  </div>
                  <span className="text-[11px] font-bold flex-shrink-0 ml-2" style={{ color: barColor }}>
                    {member.completed}/{member.total}
                  </span>
                </div>
                {/* Custom progress bar */}
                <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${member.rate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                      boxShadow: `0 0 6px ${barColor}60`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] font-medium" style={{ color: barColor }}>{member.rate}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
