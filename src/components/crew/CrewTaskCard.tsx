'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { cn, formatDate, formatDateRelative, isOverdue } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';
import { CATEGORIES, STATUSES } from '@/lib/types';
import { Calendar, User, Clock, FileText, Pencil, Check, X } from 'lucide-react';

interface CrewTaskCardProps {
  task: Task;
  onStatusUpdate: (taskId: string, status: TaskStatus) => void;
  onProgressUpdate?: (taskId: string, progress: number) => void;
}

export function CrewTaskCard({ task, onStatusUpdate, onProgressUpdate }: CrewTaskCardProps) {
  const statusActions: TaskStatus[] = ['yet_to_start', 'in_progress', 'completed'];

  const [showProgressInput, setShowProgressInput] = useState(false);
  const [inputValue, setInputValue] = useState(String(task.completionPercentage));
  const [inputError, setInputError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showProgressInput) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [showProgressInput]);

  useEffect(() => {
    if (!showProgressInput) {
      setInputValue(String(task.completionPercentage));
    }
  }, [task.completionPercentage, showProgressInput]);

  const handleProgressConfirm = () => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val) || val < 0 || val > 100) {
      setInputError('Enter a number between 0 and 100');
      return;
    }
    setInputError('');
    setShowProgressInput(false);
    onProgressUpdate?.(task.id, val);
    if (val === 100 && task.status !== 'completed') {
      onStatusUpdate(task.id, 'completed');
    }
  };

  const handleCancel = () => {
    setShowProgressInput(false);
    setInputValue(String(task.completionPercentage));
    setInputError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleProgressConfirm(); }
    if (e.key === 'Escape') handleCancel();
  };

  const statusColor = (status: TaskStatus) =>
    STATUSES.find(st => st.value === status)?.color ?? '#9CA3AF';

  const category = CATEGORIES.find(c => c.value === task.category);
  const pct = task.completionPercentage;

  const barColor =
    pct === 100 ? '#10B981' :
    pct >= 50   ? '#FF9900' :
                  '#F59E0B';

  const barGrad =
    pct === 100 ? 'linear-gradient(90deg,#10B98166,#10B981)' :
    pct >= 50   ? 'linear-gradient(90deg,#FF990066,#FF9900)' :
                  'linear-gradient(90deg,#F59E0B66,#F59E0B)';

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

          {/* ── Progress bar ──────────────────────────── */}
          <div className="mb-3">
            {/* Label row */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-aws-gray-400 font-medium uppercase tracking-wide">
                Progress
              </span>
              <button
                type="button"
                onClick={() => setShowProgressInput(v => !v)}
                className="flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: barColor }}
              >
                <span className="text-[11px] font-bold">{pct}%</span>
                <Pencil size={10} />
              </button>
            </div>

            {/* Track */}
            <button
              type="button"
              className="w-full h-2.5 rounded-full cursor-pointer block"
              style={{ background: 'rgba(0,0,0,0.07)' }}
              onClick={() => setShowProgressInput(v => !v)}
              title="Click to update progress"
            >
              <motion.div
                key={pct}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: barGrad,
                  boxShadow: `0 0 6px ${barColor}55`,
                }}
              />
            </button>

            {/* ── Inline input popup ──────────────────── */}
            <AnimatePresence initial={false}>
              {showProgressInput && (
                <motion.div
                  key="progress-popup"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="mt-2 p-3 rounded-xl border"
                    style={{
                      background: 'white',
                      borderColor: 'rgba(0,0,0,0.1)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                    }}
                  >
                    <p className="text-[11px] font-semibold text-aws-slate mb-2">
                      Set completion %
                    </p>

                    {/* Input row */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          ref={inputRef}
                          type="number"
                          min={0}
                          max={100}
                          value={inputValue}
                          onChange={e => { setInputValue(e.target.value); setInputError(''); }}
                          onKeyDown={handleKeyDown}
                          className="w-full border rounded-lg px-3 py-1.5 text-sm font-bold text-aws-slate outline-none pr-7"
                          style={{
                            borderColor: inputError ? '#EF4444' : 'rgba(0,0,0,0.15)',
                          }}
                          placeholder="0–100"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-aws-gray-400 font-medium pointer-events-none">
                          %
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleProgressConfirm}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: '#10B981' }}
                        title="Confirm"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(0,0,0,0.07)', color: '#6B7280' }}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {inputError && (
                      <p className="text-[10px] text-error mb-2">{inputError}</p>
                    )}

                    {/* Preset buttons */}
                    <div className="flex gap-1.5">
                      {[0, 25, 50, 75, 100].map(v => {
                        const active = Number(inputValue) === v;
                        return (
                          <button
                            type="button"
                            key={v}
                            onClick={() => { setInputValue(String(v)); setInputError(''); }}
                            className="flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                            style={{
                              borderColor: active ? barColor : 'rgba(0,0,0,0.1)',
                              background: active ? `${barColor}14` : 'transparent',
                              color: active ? barColor : '#9CA3AF',
                            }}
                          >
                            {v}%
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Status buttons ────────────────────────── */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-aws-gray-400 flex-shrink-0">
              Update:
            </span>
            {statusActions.map(status => {
              const isActive = task.status === status;
              return (
                <motion.button
                  key={status}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStatusUpdate(task.id, status)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all border',
                    isActive
                      ? 'border-2 shadow-sm'
                      : 'border border-aws-gray-200 text-aws-gray-400 hover:border-aws-gray-300',
                  )}
                  style={isActive ? {
                    borderColor: statusColor(status),
                    background: `${statusColor(status)}0A`,
                    color: statusColor(status),
                  } : {}}
                >
                  {STATUSES.find(s => s.value === status)?.label}
                </motion.button>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
