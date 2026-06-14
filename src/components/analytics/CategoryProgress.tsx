'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Task, TaskCategory } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart } from 'lucide-react';

interface CategoryProgressProps {
  tasks: Task[];
}

export function CategoryProgress({ tasks }: CategoryProgressProps) {
  const categories: TaskCategory[] = ['pre_event', 'during_event', 'post_event'];

  const data = categories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const completed = catTasks.filter(t => t.status === 'completed').length;
    return {
      name: CATEGORIES.find(c => c.value === cat)?.label || cat,
      value: catTasks.length,
      completed,
      total: catTasks.length,
      progress: catTasks.length > 0 ? (completed / catTasks.length) * 100 : 0,
      color: CATEGORIES.find(c => c.value === cat)?.color || '#999',
    };
  });

  const pieData = data.map(d => ({ name: d.name, value: d.total, color: d.color }));

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-aws-slate mb-4 flex items-center gap-2">
        <PieChart size={16} className="text-aws-orange" />
        Category Completion Progress
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #E9ECEF',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center gap-3">
          {data.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs font-medium text-aws-gray-700">{d.name}</span>
                </div>
                <span className="text-xs font-semibold text-aws-gray-600">
                  {d.completed}/{d.total}
                </span>
              </div>
              <ProgressBar value={d.progress} size="sm" showLabel />
            </motion.div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
