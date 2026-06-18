'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  User, 
  Tag, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Search, 
  ChevronDown,
  Check
} from 'lucide-react';
import { 
  type TaskCategory, 
  type Priority, 
  type CrewMember,
  CATEGORIES,
  PRIORITIES,
  TASKS_BY_CATEGORY 
} from '@/lib/types';
import { getInitials } from '@/lib/utils';

interface TaskCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  crewList: CrewMember[];
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

export function TaskCreationPanel({
  isOpen,
  onClose,
  crewList,
  onAssign
}: TaskCreationPanelProps) {
  const activeCrew = crewList.filter(u => u.isActive);
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

  const filteredCrew = activeCrew.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMember = activeCrew.find(m => m.id === assignedTo);

  const handleSelectCrew = (id: string) => {
    setAssignedTo(id);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = activeCrew.find(m => m.id === assignedTo);
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

    // Reset Form
    setTaskName('');
    setCustomTask('');
    setUseCustom(false);
    setAssignedTo('');
    setPriority('medium');
    setStartDate('');
    setDueDate('');
    setNotes('');
    onClose();
  };

  const isValid = (useCustom ? customTask : taskName) && assignedTo && dueDate;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-aws-slate/10 backdrop-blur-[2px]"
          />

          {/* Slide Over Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative h-full w-full sm:w-[480px] bg-white border-l border-aws-gray-200 drawer-container shadow-2xl flex flex-col z-10 p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-aws-gray-150">
              <div className="flex items-center gap-2">
                <Send size={15} className="text-aws-orange" />
                <h2 className="text-sm font-bold text-aws-slate uppercase tracking-wider">Assign Task</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full hover:bg-aws-gray-100 flex items-center justify-center text-aws-gray-500 hover:text-aws-slate transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs text-aws-gray-650">
              
              {/* Category */}
              <div className="space-y-2">
                <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                  <Tag size={12} className="text-aws-gray-400" /> Category
                </label>
                <div className="flex gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => { setCategory(cat.value); setTaskName(''); setUseCustom(false); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border text-center cursor-pointer ${
                        category === cat.value
                          ? 'bg-aws-orange/10 border-aws-orange/20 text-aws-orange'
                          : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                  <AlertTriangle size={12} className="text-aws-gray-400" /> Priority Level
                </label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border text-center cursor-pointer ${
                        priority === p.value
                          ? 'bg-aws-slate/5 border-aws-slate/20 font-bold'
                          : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300'
                      }`}
                      style={priority === p.value ? { color: p.color, borderColor: `${p.color}40` } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-aws-slate uppercase tracking-wider text-[10px]">Task Name</label>
                  <button
                    type="button"
                    onClick={() => setUseCustom(!useCustom)}
                    className="text-[10px] text-aws-orange hover:text-aws-orange-dark font-bold hover:underline"
                  >
                    {useCustom ? 'Select standard template' : 'Type custom name'}
                  </button>
                </div>
                {useCustom ? (
                  <input
                    type="text"
                    required
                    value={customTask}
                    onChange={e => setCustomTask(e.target.value)}
                    placeholder="Enter custom task name..."
                    className="w-full px-3 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/15 focus:border-aws-orange/20"
                  />
                ) : (
                  <div className="relative">
                    <select
                      required
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/15 focus:border-aws-orange/20 appearance-none"
                    >
                      <option value="">Select task template...</option>
                      {TASKS_BY_CATEGORY[category].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-aws-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Assignee Selection */}
              <div className="space-y-2" ref={dropdownRef}>
                <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                  <User size={12} className="text-aws-gray-400" /> Crew Member
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-xs text-aws-slate text-left"
                  >
                    <User size={13} className="text-aws-gray-400 flex-shrink-0" />
                    {selectedMember ? (
                      <span className="flex-1 truncate font-semibold">{selectedMember.name}</span>
                    ) : (
                      <span className="flex-1 text-aws-gray-400">Select crew assignee...</span>
                    )}
                    <ChevronDown size={13} className={`text-aws-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-aws-gray-200 shadow-xl z-20 overflow-hidden"
                      >
                        <div className="p-2 border-b border-aws-gray-100">
                          <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aws-gray-400" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              placeholder="Search crew members..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-aws-gray-200 bg-white text-[11px] text-aws-slate placeholder-aws-gray-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {filteredCrew.length > 0 ? filteredCrew.map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectCrew(m.id)}
                              className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-aws-gray-50 transition-colors text-left border-b border-aws-gray-50/50 last:border-0`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded-full gradient-slate flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0">
                                  {getInitials(m.name)}
                                </div>
                                <span className="text-[11px] font-semibold text-aws-slate truncate">{m.name}</span>
                              </div>
                              {assignedTo === m.id && (
                                <Check size={12} className="text-aws-orange" />
                              )}
                            </button>
                          )) : (
                            <div className="px-3 py-6 text-center text-xs text-aws-gray-400">
                              No active crew found
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                    <Calendar size={12} className="text-aws-gray-400" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-aws-gray-200 rounded-lg bg-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                    <Calendar size={12} className="text-aws-gray-400" /> Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-aws-gray-200 rounded-lg bg-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                  <FileText size={12} className="text-aws-gray-400" /> Notes & Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Allocate task instructions, specific guidelines or notes..."
                  className="w-full px-3 py-2 border border-aws-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aws-orange/15 focus:border-aws-orange/20 text-xs resize-none"
                />
              </div>

            </form>

            {/* Footer Form Submit */}
            <div className="pt-3 border-t border-aws-gray-150 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-aws-gray-200 text-aws-gray-500 font-bold hover:bg-aws-gray-50 rounded-xl transition-all cursor-pointer text-center text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                  isValid 
                    ? 'gradient-orange text-white shadow-aws-orange/15 hover:shadow-lg' 
                    : 'bg-aws-gray-200 text-aws-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Send size={12} /> Assign Task
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
