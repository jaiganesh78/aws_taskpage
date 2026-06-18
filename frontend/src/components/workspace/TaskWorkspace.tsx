'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  LayoutGrid, 
  List, 
  Kanban,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import type { Task, CrewMember, TaskStatus } from '@/lib/types';
import { CATEGORIES, PRIORITIES, STATUSES } from '@/lib/types';
import { formatDate, getInitials, isOverdue } from '@/lib/utils';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';

interface TaskWorkspaceProps {
  tasks: Task[];
  viewMode: 'grid' | 'list' | 'kanban';
  onViewModeChange: (mode: 'grid' | 'list' | 'kanban') => void;
  onSelectTask: (taskId: string) => void;
  isCore: boolean;
}

export function TaskWorkspace({
  tasks,
  viewMode,
  onViewModeChange,
  onSelectTask,
  isCore,
}: TaskWorkspaceProps) {

  // Sort tasks by priority level (critical first, then high, medium, low)
  const sortedTasks = useMemo(() => {
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...tasks].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }, [tasks]);

  // Split tasks into Kanban boards columns
  const kanbanColumns = useMemo(() => {
    const cols: Record<string, Task[]> = {
      yet_to_start: [],
      in_progress: [],
      under_review: [],
      blocked: [],
      completed: []
    };
    
    sortedTasks.forEach(task => {
      if (task.status === 'not_assigned' || task.status === 'assigned' || task.status === 'yet_to_start') {
        cols.yet_to_start.push(task);
      } else if (task.status === 'in_progress') {
        cols.in_progress.push(task);
      } else if (task.status === 'under_review') {
        cols.under_review.push(task);
      } else if (task.status === 'blocked') {
        cols.blocked.push(task);
      } else if (task.status === 'completed') {
        cols.completed.push(task);
      }
    });
    
    return cols;
  }, [sortedTasks]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 5 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-4">
      {/* View Switcher Controls */}
      <div className="flex justify-end items-center gap-2">
        <span className="text-[10px] text-aws-gray-450 uppercase font-bold tracking-wider mr-2">Layout View:</span>
        <div className="flex rounded-lg border border-aws-gray-200 bg-aws-gray-50/50 p-0.5 shadow-sm">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md cursor-pointer transition-all ${
              viewMode === 'grid' ? 'bg-white text-aws-orange shadow-sm font-semibold' : 'text-aws-gray-500 hover:text-aws-slate'
            }`}
            title="Card Grid"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md cursor-pointer transition-all ${
              viewMode === 'list' ? 'bg-white text-aws-orange shadow-sm font-semibold' : 'text-aws-gray-500 hover:text-aws-slate'
            }`}
            title="Compact List"
          >
            <List size={13} />
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`p-1.5 rounded-md cursor-pointer transition-all ${
              viewMode === 'kanban' ? 'bg-white text-aws-orange shadow-sm font-semibold' : 'text-aws-gray-500 hover:text-aws-slate'
            }`}
            title="Kanban Board"
          >
            <Kanban size={13} />
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {sortedTasks.map(task => {
            const isTaskOverdue = isOverdue(task.dueDate) && task.status !== 'completed';
            const categoryObj = CATEGORIES.find(c => c.value === task.category);
            
            return (
              <motion.div
                key={task.id}
                variants={itemVariants}
                onClick={() => onSelectTask(task.id)}
                className={`bg-white border border-aws-gray-150 hover:border-aws-gray-250 p-5 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[170px] relative group border-t-4 ${
                  task.category === 'pre_event' ? 'border-t-purple-400' :
                  task.category === 'during_event' ? 'border-t-aws-orange' :
                  task.category === 'post_event' ? 'border-t-emerald-400' : 'border-t-aws-gray-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span 
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        task.category === 'pre_event' ? 'bg-purple-50 text-purple-700 border border-purple-100/55' :
                        task.category === 'during_event' ? 'bg-orange-50 text-orange-700 border border-orange-200/55' :
                        task.category === 'post_event' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/55' :
                        'bg-aws-gray-50 text-aws-gray-650 border border-aws-gray-200/55'
                      }`}
                    >
                      {categoryObj?.label || task.category.replace('_', ' ')}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-aws-slate group-hover:text-aws-orange transition-colors truncate">
                      {task.name}
                    </h3>
                    <p className="text-xs text-aws-gray-500 line-clamp-2 mt-1 leading-normal">
                      {task.notes || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-aws-gray-100 pt-3.5 mt-4 flex items-center justify-between text-xs text-aws-gray-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-aws-slate/5 border border-aws-gray-200 flex items-center justify-center text-[9px] font-bold text-aws-slate flex-shrink-0">
                      {task.assignedTo ? getInitials(task.assignedTo.name) : <User size={10} />}
                    </div>
                    <span className="truncate max-w-[100px] text-[11px] font-medium text-aws-slate">
                      {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={task.status} />
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${isTaskOverdue ? 'text-red-500' : 'text-aws-slate'}`}>
                      {task.progress}%
                    </span>
                  </div>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${isTaskOverdue ? 'text-red-500 font-bold' : 'text-aws-gray-400'}`}>
                    <Calendar size={10} />
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {sortedTasks.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white border border-dashed border-aws-gray-250 rounded-xl">
              <FileText size={32} className="text-aws-gray-300 mx-auto mb-2" />
              <p className="text-xs text-aws-gray-455">No tasks available in this workspace context.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* COMPACT LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border border-aws-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-aws-gray-50 border-b border-aws-gray-250 font-bold text-aws-slate">
                  <th className="p-3.5">Task Description</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assignee</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aws-gray-100">
                {sortedTasks.map(task => {
                  const isTaskOverdue = isOverdue(task.dueDate) && task.status !== 'completed';
                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className="hover:bg-aws-gray-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="p-3.5 font-bold text-aws-slate group-hover:text-aws-orange truncate max-w-xs">
                        {task.name}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          task.category === 'pre_event' ? 'bg-purple-50 text-purple-700 border-purple-100/50' :
                          task.category === 'during_event' ? 'bg-orange-50 text-orange-700 border-orange-200/50' :
                          task.category === 'post_event' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                          'bg-aws-gray-55 text-aws-gray-650 border-aws-gray-200/50'
                        }`}>
                          {task.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-4.5 h-4.5 rounded-full bg-aws-slate/5 flex items-center justify-center text-[8px] font-bold text-aws-slate">
                            {task.assignedTo ? getInitials(task.assignedTo.name) : <User size={9} />}
                          </div>
                          <span className="truncate max-w-[100px] text-[11px]">
                            {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className={`p-3.5 font-medium ${isTaskOverdue ? 'text-red-500 font-bold' : 'text-aws-gray-500'}`}>
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-aws-slate text-xs">
                        {task.progress}%
                      </td>
                    </tr>
                  );
                })}
                {sortedTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-aws-gray-400">
                      No tasks found in list view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 workspace-scrollable">
          {(Object.keys(kanbanColumns) as Array<keyof typeof kanbanColumns>).map(colKey => {
            const colTasks = kanbanColumns[colKey];
            
            const titleMap: Record<string, string> = {
              yet_to_start: 'To Do',
              in_progress: 'In Progress',
              under_review: 'Under Review',
              blocked: 'Changes Requested',
              completed: 'Completed'
            };

            const borderColors: Record<string, string> = {
              yet_to_start: 'border-t-aws-gray-300',
              in_progress: 'border-t-aws-orange',
              under_review: 'border-t-purple-400',
              blocked: 'border-t-red-400',
              completed: 'border-t-emerald-400'
            };

            return (
              <div 
                key={colKey} 
                className="w-72 flex-shrink-0 bg-aws-gray-50/30 border border-aws-gray-200 rounded-xl p-3.5 flex flex-col max-h-[60vh]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between mb-3 pb-2 border-b border-aws-gray-150 border-t-2 ${borderColors[colKey]}`}>
                  <span className="text-xs font-bold text-aws-slate flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      colKey === 'completed' ? 'bg-emerald-500' : colKey === 'blocked' ? 'bg-red-500' : colKey === 'in_progress' ? 'bg-aws-orange' : 'bg-aws-gray-400'
                    }`} />
                    {titleMap[colKey]}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-aws-gray-200 text-aws-gray-500">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2 overflow-y-auto flex-1 pr-1 workspace-scrollable">
                  {colTasks.map(task => {
                    const isTaskOverdue = isOverdue(task.dueDate) && task.status !== 'completed';
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task.id)}
                        className={`bg-white border border-aws-gray-150 hover:border-aws-orange/30 p-3.5 rounded-lg shadow-sm cursor-pointer hover:shadow transition-all space-y-2.5 group border-t-4 ${
                          task.category === 'pre_event' ? 'border-t-purple-400' :
                          task.category === 'during_event' ? 'border-t-aws-orange' :
                          task.category === 'post_event' ? 'border-t-emerald-400' : 'border-t-aws-gray-300'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-aws-slate group-hover:text-aws-orange transition-colors line-clamp-2 leading-snug">
                          {task.name}
                        </h4>
                        
                        <div className="flex items-center justify-between text-[10px] text-aws-gray-400 border-t border-aws-gray-55 pt-2 flex-wrap gap-1">
                          <div className="flex items-center gap-1">
                            <Calendar size={10} />
                            <span className={isTaskOverdue ? 'text-red-500 font-bold' : ''}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-aws-slate">{task.progress}%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] border-t border-aws-gray-55 pt-2">
                          <PriorityBadge priority={task.priority} />
                          <div className="w-4.5 h-4.5 rounded-full bg-aws-slate/5 flex items-center justify-center text-[8px] font-bold text-aws-slate">
                            {task.assignedTo ? getInitials(task.assignedTo.name) : 'U'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="text-center py-12 text-[10px] text-aws-gray-400 italic">
                      No tasks in column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
