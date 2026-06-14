'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import type { Task, TaskStatus } from '@/lib/types';
import { STATUSES } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface StatusDistributionProps {
  tasks: Task[];
}

export function StatusDistribution({ tasks }: StatusDistributionProps) {
  const data = STATUSES.map(s => {
    const count = tasks.filter(t => t.status === s.value).length;
    return {
      name: s.label,
      value: count,
      color: s.color,
    };
  });

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-4">Task Status Distribution</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6C757D' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6C757D' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid #E9ECEF',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data.map((entry, i) => (
                <motion.div key={i} style={{ display: 'contents' }}>
                  <Cell key={i} fill={entry.color} />
                </motion.div>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
