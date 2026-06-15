'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { getInitials } from '@/lib/utils';
import type { CrewMember, Task } from '@/lib/types';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

interface CrewAvailabilityProps {
  members: CrewMember[];
  tasks: Task[];
}

export function CrewAvailability({ members, tasks }: CrewAvailabilityProps) {
  const activeTaskIds = new Set<string>();
  tasks.forEach(t => {
    if (t.assignedTo && t.status !== 'completed') {
      activeTaskIds.add(t.assignedTo.id);
    }
  });

  const sorted = [...members].sort((a, b) => {
    const aActive = activeTaskIds.has(a.id) ? 1 : 0;
    const bActive = activeTaskIds.has(b.id) ? 1 : 0;
    return aActive - bActive;
  });

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <Users size={14} className="text-aws-orange" />
        Crew Availability
      </h3>
      <div className="space-y-1">
        {sorted.map((member, i) => {
          const isAvailable = !activeTaskIds.has(member.id);
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #232F3E 0%, #3d4f63 100%)' }}
              >
                {getInitials(member.name)}
              </div>
              <span className="text-xs font-medium text-aws-slate whitespace-nowrap">{member.name}</span>
              {isAvailable ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-success flex-shrink-0">
                  <CheckCircle2 size={12} />
                  Available
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-error flex-shrink-0">
                  <XCircle size={12} />
                  Not Available
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
