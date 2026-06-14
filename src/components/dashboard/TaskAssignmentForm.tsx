'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import {
  CATEGORIES,
  TASKS_BY_CATEGORY,
  PRIORITIES,
  type TaskCategory,
  type Priority,
  type CrewMember,
} from '@/lib/types';
import { crewMembers } from '@/lib/mockData';
import { Send, User, Tag, AlertTriangle, Calendar, FileText } from 'lucide-react';

interface TaskAssignmentFormProps {
  onAssign: (data: {
    taskName: string;
    category: TaskCategory;
    priority: Priority;
    assignedTo: CrewMember;
    dueDate: string;
    notes: string;
  }) => void;
}

export function TaskAssignmentForm({ onAssign }: TaskAssignmentFormProps) {
  const [category, setCategory] = useState<TaskCategory>('pre_event');
  const [taskName, setTaskName] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = crewMembers.find(m => m.id === assignedTo);
    if (!member || !dueDate) return;

    onAssign({
      taskName: useCustom ? customTask : taskName,
      category,
      priority,
      assignedTo: member,
      dueDate,
      notes,
    });

    setTaskName('');
    setCustomTask('');
    setUseCustom(false);
    setAssignedTo('');
    setPriority('medium');
    setDueDate('');
    setNotes('');
  };

  const isValid = (useCustom ? customTask : taskName) && assignedTo && dueDate;

  return (
    <GlassCard strong glow="orange" className="lg:col-span-2">
      <h3 className="text-base font-semibold text-aws-slate mb-4 flex items-center gap-2">
        <Send size={16} className="text-aws-orange" />
        Assign New Task
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
              <Tag size={12} /> Category
            </label>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { setCategory(cat.value); setTaskName(''); setUseCustom(false); }}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                    category === cat.value
                      ? 'bg-aws-orange/8 border-aws-orange/30 text-aws-orange'
                      : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300',
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                    priority === p.value
                      ? 'bg-aws-orange/8 border-aws-orange/30'
                      : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300',
                  )}
                  style={priority === p.value ? { color: p.color, borderColor: `${p.color}40` } : {}}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-aws-gray-600">Task</label>
            <button
              type="button"
              onClick={() => setUseCustom(!useCustom)}
              className="text-[11px] text-aws-orange hover:text-aws-orange-dark font-medium"
            >
              {useCustom ? 'Choose from list' : 'Custom task'}
            </button>
          </div>
          {useCustom ? (
            <input
              type="text"
              value={customTask}
              onChange={e => setCustomTask(e.target.value)}
              placeholder="Enter custom task name..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all"
            />
          ) : (
            <select
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all appearance-none"
            >
              <option value="">Select a task...</option>
              {TASKS_BY_CATEGORY[category].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
              <User size={12} /> Assign To
            </label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all appearance-none"
            >
              <option value="">Select crew member...</option>
              {crewMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
              <Calendar size={12} /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
            <FileText size={12} /> Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Add task notes or instructions..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all resize-none"
          />
        </div>

        <motion.button
          type="submit"
          disabled={!isValid}
          whileHover={isValid ? { scale: 1.01 } : {}}
          whileTap={isValid ? { scale: 0.99 } : {}}
          className={cn(
            'w-full py-5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
            isValid
              ? 'gradient-orange text-white shadow-lg shadow-aws-orange/20 hover:shadow-xl hover:shadow-aws-orange/30'
              : 'bg-aws-gray-100 text-aws-gray-400 cursor-not-allowed',
          )}
        >
          <Send size={15} />
          Assign Task
        </motion.button>
      </form>
    </GlassCard>
  );
}
