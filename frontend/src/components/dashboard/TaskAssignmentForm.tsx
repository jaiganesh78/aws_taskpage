'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { crewMembers as initialCrew } from '@/lib/mockData';
import { Send, User, Tag, AlertTriangle, Calendar, FileText, Plus, Check, Search, Trash2, ChevronDown } from 'lucide-react';

interface TaskAssignmentFormProps {
  onAssign: (data: {
    taskName: string;
    category: TaskCategory;
    priority: Priority;
    assignedTo: CrewMember;
    startDate: string;
    dueDate: string;
    notes: string;
  }) => void;
}

let nextCrewId = 20;

export function TaskAssignmentForm({ onAssign }: TaskAssignmentFormProps) {
  const [crewList, setCrewList] = useState<CrewMember[]>(initialCrew);
  const [newCrewName, setNewCrewName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<TaskCategory>('pre_event');
  const [taskName, setTaskName] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

  const filteredCrew = crewList.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedMember = crewList.find(m => m.id === assignedTo);

  const handleAddCrew = () => {
    if (!newCrewName.trim()) return;
    const id = `c${nextCrewId++}`;
    const member: CrewMember = {
      id,
      name: newCrewName.trim(),
      role: '',
      avatar: '',
      tasksCompleted: 0,
      totalTasks: 0,
      completionRate: 0,
    };
    setCrewList(prev => [...prev, member]);
    setNewCrewName('');
    setShowAddModal(false);
  };

  const handleRemoveCrew = (id: string) => {
    setCrewList(prev => prev.filter(m => m.id !== id));
    if (assignedTo === id) setAssignedTo('');
  };

  const handleSelectCrew = (id: string) => {
    setAssignedTo(id);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = crewList.find(m => m.id === assignedTo);
    if (!member || !dueDate) return;

    onAssign({
      taskName: useCustom ? customTask : taskName,
      category,
      priority,
      assignedTo: member,
      startDate,
      dueDate,
      notes,
    });

    setTaskName('');
    setCustomTask('');
    setUseCustom(false);
    setAssignedTo('');
    setPriority('medium');
    setStartDate('');
    setDueDate('');
    setNotes('');
  };

  const isValid = (useCustom ? customTask : taskName) && assignedTo && dueDate;

  return (
    <GlassCard strong glow="orange">
      <h3 className="text-base font-semibold text-aws-slate mb-3 flex items-center gap-2">
        <Send size={16} className="text-aws-orange" />
        Assign New Task
      </h3>

      <form onSubmit={handleSubmit} className="space-y-2.5">
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
                  'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
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
                  'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
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
              className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all"
            />
          ) : (
            <select
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all appearance-none"
            >
              <option value="">Select a task...</option>
              {TASKS_BY_CATEGORY[category].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5" ref={dropdownRef}>
          <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
            <User size={12} /> Assign To
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate transition-all text-left"
              >
                <User size={14} className="text-aws-gray-400 flex-shrink-0" />
                {selectedMember ? (
                  <span className="flex-1 truncate">{selectedMember.name}</span>
                ) : (
                  <span className="flex-1 text-aws-gray-400">Select crew member...</span>
                )}
                <ChevronDown size={14} className={cn('text-aws-gray-400 transition-transform', showDropdown && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-aws-gray-200 shadow-lg z-20 overflow-hidden"
                  >
                    <div className="p-2 border-b border-aws-gray-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aws-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search crew..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-aws-gray-200 bg-white text-xs text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCrew.length > 0 ? filteredCrew.map(m => (
                        <div
                          key={m.id}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 transition-colors',
                            assignedTo === m.id ? 'bg-aws-orange/5' : 'hover:bg-aws-gray-50',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectCrew(m.id)}
                            className="flex-1 flex items-center gap-2 text-left"
                          >
                            <div className="w-6 h-6 rounded-full gradient-slate flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-aws-slate truncate block">{m.name}</span>
                            </div>
                            {assignedTo === m.id && (
                              <Check size={13} className="text-aws-orange flex-shrink-0" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCrew(m.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-aws-gray-400 hover:text-error hover:bg-error/5 transition-all flex-shrink-0"
                            title="Remove crew member"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )) : (
                        <div className="px-3 py-6 text-center text-xs text-aws-gray-400">
                          No crew members found
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 rounded-lg border border-aws-gray-200 text-aws-orange hover:bg-aws-orange/5 transition-all flex items-center gap-1 text-xs font-medium"
              title="Add crew member"
            >
              <Plus size={14} />
            </button>
          </div>
          {selectedMember && (
            <div className="flex items-center gap-1.5 text-[11px] text-aws-gray-500">
              <span className="font-medium text-aws-slate">{selectedMember.name}</span>
            </div>
          )}
        </div>

        {/* Add Crew Modal */}
        <AnimatePresence>
          {showAddModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                onClick={() => setShowAddModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
              >
                <div className="glass-card-strong rounded-xl p-5 mx-4">
                  <h4 className="text-sm font-semibold text-aws-slate mb-4">Add Crew Member</h4>
                  <input
                    type="text"
                    value={newCrewName}
                    onChange={e => setNewCrewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCrew(); }}
                    placeholder="Enter crew name..."
                    className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all mb-4"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCrew}
                      disabled={!newCrewName.trim()}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                        newCrewName.trim()
                          ? 'gradient-orange text-white shadow-lg shadow-aws-orange/20'
                          : 'bg-aws-gray-100 text-aws-gray-400 cursor-not-allowed',
                      )}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddModal(false); setNewCrewName(''); }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold border border-aws-gray-200 text-aws-gray-500 hover:bg-aws-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
              <Calendar size={12} /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-aws-gray-600 flex items-center gap-1.5">
              <Calendar size={12} /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all"
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
            rows={1}
            placeholder="Add task notes or instructions..."
            className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30 transition-all resize-none"
          />
        </div>

        <motion.button
          type="submit"
          disabled={!isValid}
          whileHover={isValid ? { scale: 1.01 } : {}}
          whileTap={isValid ? { scale: 0.99 } : {}}
          className={cn(
            'w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
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
