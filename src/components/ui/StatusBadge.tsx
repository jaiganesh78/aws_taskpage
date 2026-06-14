'use client';

import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/lib/types';
import { STATUSES } from '@/lib/types';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const s = STATUSES.find(s => s.value === status);
  if (!s) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className,
      )}
      style={{
        background: `${s.color}12`,
        color: s.color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}
