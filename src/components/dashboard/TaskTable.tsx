'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn, formatDate, isOverdue, getInitials } from '@/lib/utils';
import type { Task, TaskCategory, Priority, TaskStatus } from '@/lib/types';
import { CATEGORIES, PRIORITIES, STATUSES } from '@/lib/types';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Edit3,
  Trash2,
  ChevronDown,
  Clock,
  User,
  Filter,
  X,
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onStatusUpdate: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onProgressUpdate?: (taskId: string, progress: number) => void;
}

export function TaskTable({ tasks, onStatusUpdate, onDelete, onProgressUpdate }: TaskTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'name'>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [progressTaskId, setProgressTaskId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState('');
  const progressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (progressTaskId) {
      setTimeout(() => progressInputRef.current?.focus(), 50);
    }
  }, [progressTaskId]);

  const handleProgressConfirm = (taskId: string) => {
    const val = parseInt(progressValue, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      onProgressUpdate?.(taskId, val);
    }
    setProgressTaskId(null);
    setProgressValue('');
  };

  const filtered = useMemo(() => {
    return tasks
      .filter(t => {
        if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
            !t.assignedTo?.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'dueDate') return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir;
        if (sortBy === 'priority') {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[a.priority] - order[b.priority]) * dir;
        }
        return a.name.localeCompare(b.name) * dir;
      });
  }, [tasks, search, categoryFilter, priorityFilter, statusFilter, sortBy, sortDir]);

  const toggleSort = (field: 'dueDate' | 'priority' | 'name') => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const quickStatuses: TaskStatus[] = ['yet_to_start', 'in_progress', 'completed'];

  return (
    <GlassCard strong className="overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-aws-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks or crew..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
            showFilters
              ? 'bg-aws-orange/8 border-aws-orange/30 text-aws-orange'
              : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300',
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
          {(categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
            <span className="w-2 h-2 rounded-full bg-aws-orange" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 pb-4 border-b border-aws-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-aws-gray-500">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as TaskCategory | 'all')}
                  className="px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white text-xs text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                >
                  <option value="all">All</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-aws-gray-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value as Priority | 'all')}
                  className="px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white text-xs text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                >
                  <option value="all">All</option>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-aws-gray-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
                  className="px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white text-xs text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                >
                  <option value="all">All</option>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => { setCategoryFilter('all'); setPriorityFilter('all'); setStatusFilter('all'); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-aws-gray-500 hover:text-aws-slate hover:bg-aws-gray-50 transition-all"
              >
                <X size={12} /> Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-aws-gray-100">
              <th className="text-left text-xs font-medium text-aws-gray-500 pb-3 pr-4">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-aws-slate transition-colors">
                  Task <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="text-left text-xs font-medium text-aws-gray-500 pb-3 pr-4">
                <span className="flex items-center gap-1"><User size={11} /> Assigned To</span>
              </th>
              <th className="text-left text-xs font-medium text-aws-gray-500 pb-3 pr-4 hidden md:table-cell">Category</th>
              <th className="text-left text-xs font-medium text-aws-gray-500 pb-3 pr-4">
                <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 hover:text-aws-slate transition-colors">
                  Priority <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="text-left text-xs font-medium text-aws-gray-500 pb-3 pr-4">
                <button onClick={() => toggleSort('dueDate')} className="flex items-center gap-1 hover:text-aws-slate transition-colors">
                  <Clock size={11} /> Due Date <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="text-left text-xs font-medium text-aws-gray-500 pb-3 pr-4">Status</th>
              <th className="text-left text-xs font-medium text-aws-gray-500 pb-3 pr-4 hidden lg:table-cell">Progress</th>
              <th className="text-right text-xs font-medium text-aws-gray-500 pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((task, i) => (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'border-b border-aws-gray-50 group transition-colors hover:bg-aws-gray-50/50',
                    isOverdue(task.dueDate) && task.status !== 'completed' && 'bg-error/[0.02]',
                  )}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-aws-slate">{task.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {getInitials(task.assignedTo.name)}
                        </div>
                        <span className="text-sm text-aws-gray-600">{task.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-aws-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: `${CATEGORIES.find(c => c.value === task.category)?.color}12`,
                        color: CATEGORIES.find(c => c.value === task.category)?.color,
                      }}
                    >
                      {CATEGORIES.find(c => c.value === task.category)?.label}
                    </span>
                  </td>
                  <td className="py-3 pr-4"><PriorityBadge priority={task.priority} /></td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'text-sm',
                      isOverdue(task.dueDate) && task.status !== 'completed'
                        ? 'text-error font-medium'
                        : 'text-aws-gray-600',
                    )}>
                      {formatDate(task.dueDate)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="relative group/status">
                      <StatusBadge status={task.status} />
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-aws-gray-100 p-1 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-10 min-w-[140px]">
                        {quickStatuses.map(s => (
                          <button
                            key={s}
                            onClick={() => onStatusUpdate(task.id, s)}
                            className={cn(
                              'w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                              task.status === s ? 'bg-aws-gray-100' : 'hover:bg-aws-gray-50',
                            )}
                          >
                            {STATUSES.find(st => st.value === s)?.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell relative">
                    <button
                      type="button"
                      onClick={() => {
                        setProgressTaskId(progressTaskId === task.id ? null : task.id);
                        setProgressValue(String(task.completionPercentage));
                      }}
                      className="w-full text-left"
                    >
                      <ProgressBar value={task.completionPercentage} size="sm" />
                    </button>
                    {progressTaskId === task.id && (
                      <div
                        className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-aws-gray-100 p-2 z-20 min-w-[160px]"
                        style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <input
                            ref={progressInputRef}
                            type="number"
                            min={0}
                            max={100}
                            value={progressValue}
                            onChange={e => setProgressValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleProgressConfirm(task.id);
                              if (e.key === 'Escape') { setProgressTaskId(null); setProgressValue(''); }
                            }}
                            className="w-full border rounded-md px-2 py-1 text-xs font-bold text-aws-slate outline-none"
                            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                            placeholder="0–100"
                          />
                          <span className="text-xs text-aws-gray-400 font-medium">%</span>
                        </div>
                        <div className="flex gap-1">
                          {[0, 25, 50, 75, 100].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => { setProgressValue(String(v)); handleProgressConfirm(task.id); }}
                              className="flex-1 py-0.5 rounded text-[10px] font-semibold border transition-all"
                              style={{
                                borderColor: 'rgba(0,0,0,0.1)',
                                color: '#6B7280',
                              }}
                            >
                              {v}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onDelete(task.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-aws-gray-400 hover:text-error hover:bg-error/5 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-aws-gray-400 text-sm">
            No tasks match your filters
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-aws-gray-100 flex items-center justify-between text-xs text-aws-gray-400">
        <span>{filtered.length} of {tasks.length} tasks</span>
      </div>
    </GlassCard>
  );
}
