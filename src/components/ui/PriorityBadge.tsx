'use client';

import { cn } from '@/lib/utils';
import type { Priority } from '@/lib/types';
import { PRIORITIES } from '@/lib/types';
import { AlertTriangle, AlertCircle, ArrowDown, Minus } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
  className?: string;
}

const icons = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: Minus,
  low: ArrowDown,
};

const styles: Record<Priority, { bg: string; border: string; color: string }> = {
  critical: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  color: '#EF4444' },
  high:     { bg: 'rgba(255,153,0,0.08)',  border: 'rgba(255,153,0,0.3)',  color: '#FF9900' },
  medium:   { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', color: '#F59E0B' },
  low:      { bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.25)',color: '#6B7280' },
};

export function PriorityBadge({ priority, size = 'sm', className }: PriorityBadgeProps) {
  const p = PRIORITIES.find(p => p.value === priority);
  if (!p) return null;

  const Icon = icons[priority];
  const s = styles[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-lg border',
        size === 'sm' ? 'text-[11px] px-2 py-1' : 'text-xs px-2.5 py-1.5',
        className,
      )}
      style={{
        background: s.bg,
        borderColor: s.border,
        color: s.color,
      }}
    >
      <Icon size={size === 'sm' ? 10 : 12} strokeWidth={2.5} />
      {p.label} Priority
    </span>
  );
}
