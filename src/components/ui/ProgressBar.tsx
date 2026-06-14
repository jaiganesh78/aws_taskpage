'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'slate' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

const colorMap = {
  orange: 'bg-aws-orange',
  slate: 'bg-aws-slate',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  purple: 'bg-purple',
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'orange',
  showLabel = false,
  className,
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'flex-1 rounded-full bg-aws-gray-100 overflow-hidden',
        sizeMap[size],
      )}>
        <motion.div
          initial={animated ? { width: 0 } : undefined}
          whileInView={animated ? { width: `${percentage}%` } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={cn(
            'h-full rounded-full relative',
            colorMap[color],
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]',
          )}
        >
          {percentage > 30 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </motion.div>
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-aws-gray-600 min-w-[3ch] text-right tabular-nums">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
