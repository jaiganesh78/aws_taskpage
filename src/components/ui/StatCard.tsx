'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: 'orange' | 'slate' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  className?: string;
}

const colorMap = {
  orange: 'gradient-orange',
  slate: 'gradient-slate',
  success: 'gradient-success',
  warning: 'gradient-warning',
  error: 'gradient-error',
  info: 'gradient-info',
  purple: 'gradient-purple',
};

const colorBadgeMap = {
  orange: 'bg-aws-orange/10 text-aws-orange',
  slate: 'bg-aws-slate/10 text-aws-slate',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  purple: 'bg-purple/10 text-purple',
};

export function StatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon,
  trend,
  color = 'orange',
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'glass-card rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group',
        'border-l-[3px] border-l-aws-orange/30',
        className,
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
        <div className={cn('w-full h-full rounded-full blur-3xl', colorMap[color])} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-aws-gray-600 uppercase tracking-wider">
          {label}
        </span>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
          colorBadgeMap[color],
        )}>
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-aws-slate">
          {prefix && <span className="text-sm mr-0.5">{prefix}</span>}
          <AnimatedCounter value={value} />
          {suffix && <span className="text-sm ml-0.5">{suffix}</span>}
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            trend.positive ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
          )}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            {trend.value}%
          </div>
        )}
      </div>
    </motion.div>
  );
}
