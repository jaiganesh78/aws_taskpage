'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { cn, formatDate, formatDateRelative, isOverdue, getOverdueDays, getDelayText } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { Calendar, User, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface CrewTaskCardProps {
  task: Task;
  onStatusUpdate: (taskId: string, status: TaskStatus) => void;
}

export function CrewTaskCard({ task, onStatusUpdate }: CrewTaskCardProps) {
  const category = CATEGORIES.find(c => c.value === task.category);
  const isCompleted = task.status === 'completed';

  return (
    /* Outer wrapper — NOT layout-animated so popup can expand freely */
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard
          glow={task.priority === 'critical' ? 'orange' : 'none'}
          className={cn(
            'border-l-[3px]',
            task.priority === 'critical' ? 'border-l-error'       :
            task.priority === 'high'     ? 'border-l-aws-orange'  :
            task.priority === 'medium'   ? 'border-l-warning'     :
                                           'border-l-aws-gray-300',
          )}
        >
          {/* ── Task name ─────────────────────────────── */}
          <h4 className="text-sm font-semibold text-aws-slate mb-2 leading-snug">
            {task.name}
          </h4>

          {/* ── Status + Category ─────────────────────── */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusBadge status={task.status} />
            {task.status === 'completed' && getOverdueDays(task.dueDate, task.completedAt) > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/10 text-warning whitespace-nowrap">
                {getDelayText(task.dueDate, task.completedAt)}
              </span>
            )}
            {category && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${category.color}14`, color: category.color }}
              >
                {category.label}
              </span>
            )}
          </div>

          {/* ── Priority — own row ────────────────────── */}
          <div className="mb-2.5">
            <PriorityBadge priority={task.priority} />
          </div>

          {/* ── Assigned by ───────────────────────────── */}
          {task.assignedBy && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-aws-gray-500">
              <User size={12} className="flex-shrink-0" />
              <span>Assigned by:</span>
              <span className="font-medium text-aws-gray-600 truncate">
                {task.assignedBy.name}
              </span>
            </div>
          )}

          {/* ── Dates ─────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-3 text-xs text-aws-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="flex-shrink-0" />
              <span className={cn(
                isOverdue(task.dueDate) && task.status !== 'completed'
                  ? 'text-error font-medium' : '',
              )}>
                {formatDate(task.dueDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="flex-shrink-0" />
              <span>{formatDateRelative(task.dueDate)}</span>
            </div>
          </div>

          {/* ── Notes ─────────────────────────────────── */}
          {task.notes && (
            <div className="mb-3 p-2.5 rounded-lg bg-aws-gray-50 text-xs text-aws-gray-600 flex items-start gap-2">
              <FileText size={12} className="mt-0.5 flex-shrink-0 text-aws-gray-400" />
              <span className="leading-relaxed">{task.notes}</span>
            </div>
          )}

          {/* ── Completed / Not Completed toggle ──────── */}
          <div className="flex gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStatusUpdate(task.id, 'completed')}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border',
                isCompleted
                  ? 'border-success/30 bg-success/8 text-success shadow-sm'
                  : 'border-aws-gray-200 text-aws-gray-400 hover:border-success/30 hover:text-success hover:bg-success/5',
              )}
            >
              <CheckCircle2 size={13} />
              Completed
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!isCompleted) return;
                onStatusUpdate(task.id, 'in_progress');
              }}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border',
                !isCompleted
                  ? 'border-error/30 bg-error/8 text-error shadow-sm'
                  : 'border-aws-gray-200 text-aws-gray-400 hover:border-error/30 hover:text-error hover:bg-error/5',
              )}
            >
              <XCircle size={13} />
              Not Completed
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
