'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Clock, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  User, 
  ShieldAlert,
  CalendarDays,
  Activity as ActivityIcon
} from 'lucide-react';
import type { Task, CrewMember, Activity } from '@/lib/types';
import { formatDate, isOverdue } from '@/lib/utils';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';

interface WorkOverviewProps {
  tasks: Task[];
  reviewQueue: any[];
  activityFeed: any[];
  currentUser: CrewMember | null;
  onSelectTask: (taskId: string) => void;
  onSwitchTab: (tab: string) => void;
}

export function WorkOverview({
  tasks,
  reviewQueue,
  activityFeed,
  currentUser,
  onSelectTask,
  onSwitchTab,
}: WorkOverviewProps) {
  const isCore = currentUser?.role === 'core';

  // Calculate "Needs Attention" items for current context
  const attentionItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (isCore) {
      // Core Admin Attention items:
      const reviews = reviewQueue.map(item => ({
        id: item.id,
        title: item.name,
        type: 'review_waiting' as const,
        description: `Submitted by ${item.assignedTo?.name || 'Crew'} (Revision ${item.revisionNumber || 1})`,
        meta: item.sla ? `SLA: ${item.sla}` : null,
        priority: item.priority,
        dueDate: item.dueDate,
      }));

      const overdue = tasks
        .filter(t => t.status !== 'completed' && isOverdue(t.dueDate))
        .map(t => ({
          id: t.id,
          title: t.name,
          type: 'overdue' as const,
          description: t.assignedTo ? `Assigned to ${t.assignedTo.name}` : 'Unassigned',
          meta: 'Overdue',
          priority: t.priority,
          dueDate: t.dueDate,
        }));

      const blocked = tasks
        .filter(t => t.status === 'blocked')
        .map(t => ({
          id: t.id,
          title: t.name,
          type: 'blocked' as const,
          description: t.assignedTo ? `Assigned to ${t.assignedTo.name}` : 'Unassigned',
          meta: 'Blocked / Changes Requested',
          priority: t.priority,
          dueDate: t.dueDate,
        }));

      return [...reviews, ...overdue, ...blocked];
    } else {
      // Crew Member Attention items:
      const myActiveTasks = tasks.filter(t => t.assignedTo?.id === currentUser?.id && t.status !== 'completed');

      const overdue = myActiveTasks
        .filter(t => isOverdue(t.dueDate))
        .map(t => ({
          id: t.id,
          title: t.name,
          type: 'overdue' as const,
          description: 'Assigned to me',
          meta: 'Overdue',
          priority: t.priority,
          dueDate: t.dueDate,
        }));

      const blocked = myActiveTasks
        .filter(t => t.status === 'blocked')
        .map(t => ({
          id: t.id,
          title: t.name,
          type: 'blocked' as const,
          description: 'Requires changes from me',
          meta: 'Changes Requested',
          priority: t.priority,
          dueDate: t.dueDate,
        }));

      const dueToday = myActiveTasks
        .filter(t => t.dueDate && t.dueDate.split('T')[0] === today)
        .map(t => ({
          id: t.id,
          title: t.name,
          type: 'due_today' as const,
          description: 'Due today',
          meta: 'Due Today',
          priority: t.priority,
          dueDate: t.dueDate,
        }));

      const myWork = myActiveTasks
        .filter(t => t.status === 'in_progress' || t.status === 'yet_to_start')
        .map(t => ({
          id: t.id,
          title: t.name,
          type: 'assigned_me' as const,
          description: `Status: ${t.status.replace('_', ' ')} (${t.progress}% complete)`,
          meta: 'Active Work',
          priority: t.priority,
          dueDate: t.dueDate,
        }));

      // Deduplicate by task ID, prioritizing overdue and blocked over active work
      const itemsMap = new Map<string, any>();
      [...overdue, ...blocked, ...dueToday, ...myWork].forEach(item => {
        if (!itemsMap.has(item.id)) {
          itemsMap.set(item.id, item);
        } else {
          // Keep the more urgent state
          const existing = itemsMap.get(item.id);
          if (item.type === 'overdue' || item.type === 'blocked') {
            itemsMap.set(item.id, item);
          }
        }
      });

      return Array.from(itemsMap.values());
    }
  }, [tasks, reviewQueue, isCore, currentUser]);

  // Format activities for Overview
  const filteredActivities = useMemo(() => {
    // Only return relevant actions for Overview: submissions, approvals, review requests
    return activityFeed
      .filter((log: any) => 
        log.action === 'work_submitted' || 
        log.action === 'review_approved' || 
        log.action === 'review_changes_requested'
      )
      .slice(0, 8);
  }, [activityFeed]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Needs Attention Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-aws-gray-200">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-aws-orange" />
            <h2 className="text-sm font-bold text-aws-slate">Needs Attention</h2>
            <span className="bg-aws-gray-100 text-aws-slate px-2 py-0.5 rounded-full text-[10px] font-bold">
              {attentionItems.length}
            </span>
          </div>
          {isCore ? (
            <button 
              onClick={() => onSwitchTab('Reviews')}
              className="text-xs text-aws-gray-500 hover:text-aws-orange font-semibold flex items-center gap-1 transition-colors"
            >
              Go to Review Queue <ArrowRight size={12} />
            </button>
          ) : (
            <button 
              onClick={() => onSwitchTab('My Work')}
              className="text-xs text-aws-gray-500 hover:text-aws-orange font-semibold flex items-center gap-1 transition-colors"
            >
              View My Tasks <ArrowRight size={12} />
            </button>
          )}
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {attentionItems.map((item) => {
            const isItemOverdue = isOverdue(item.dueDate) && item.meta !== 'Completed';
            
            let typeBadgeStyle = "bg-aws-gray-50 text-aws-gray-500";
            if (item.type === 'review_waiting') typeBadgeStyle = "bg-purple-50 text-purple-600 border border-purple-100";
            else if (item.type === 'overdue') typeBadgeStyle = "bg-red-50 text-red-650 border border-red-150";
            else if (item.type === 'blocked') typeBadgeStyle = "bg-yellow-55 text-yellow-700 border border-yellow-200";
            else if (item.type === 'due_today') typeBadgeStyle = "bg-orange-50 text-aws-orange border border-aws-orange/20";
            else if (item.type === 'assigned_me') typeBadgeStyle = "bg-blue-50 text-blue-600 border border-blue-100";

            return (
              <motion.div
                key={`${item.id}-${item.type}`}
                variants={itemVariants}
                onClick={() => onSelectTask(item.id)}
                className="bg-white border border-aws-gray-200 hover:border-aws-gray-300 p-4 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${typeBadgeStyle}`}>
                      {item.meta || item.type.replace('_', ' ')}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <h3 className="text-sm font-bold text-aws-slate truncate">{item.title}</h3>
                  <p className="text-xs text-aws-gray-500 flex items-center gap-1.5">
                    <User size={12} className="text-aws-gray-400" />
                    <span>{item.description}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-right">
                  <span className={`text-[10px] font-medium flex items-center gap-1 ${isItemOverdue ? 'text-red-500 font-bold' : 'text-aws-gray-500'}`}>
                    <CalendarDays size={11} />
                    {formatDate(item.dueDate)}
                  </span>
                  <div className="text-[10px] text-aws-gray-400 hover:text-aws-orange font-bold flex items-center gap-0.5">
                    Workspace <ArrowRight size={10} />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {attentionItems.length === 0 && (
            <div className="text-center py-16 bg-white border border-aws-gray-150 rounded-xl">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2.5 opacity-60" />
              <h3 className="text-sm font-bold text-aws-slate">All clear!</h3>
              <p className="text-xs text-aws-gray-400 mt-1">No items currently require immediate attention.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity Column */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-aws-gray-200">
          <div className="flex items-center gap-2">
            <ActivityIcon size={16} className="text-aws-gray-500" />
            <h2 className="text-sm font-bold text-aws-slate">Recent Activity</h2>
          </div>
          {isCore && (
            <button 
              onClick={() => onSwitchTab('Activity')}
              className="text-xs text-aws-gray-500 hover:text-aws-orange font-semibold transition-colors"
            >
              Full Audit Log
            </button>
          )}
        </div>

        <div className="bg-white border border-aws-gray-200 rounded-xl p-4 shadow-sm space-y-4">
          <div className="relative border-l border-aws-gray-150 pl-4 ml-2.5 space-y-4 py-1 text-xs">
            {filteredActivities.map((log: any) => {
              let iconColor = 'bg-aws-gray-100 text-aws-gray-650';
              let actionLabel = '';

              if (log.action === 'work_submitted') {
                iconColor = 'bg-orange-50 text-aws-orange border border-aws-orange/10';
                actionLabel = 'submitted a revision for review';
              } else if (log.action === 'review_approved') {
                iconColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                actionLabel = 'approved the submission';
              } else if (log.action === 'review_changes_requested') {
                iconColor = 'bg-red-50 text-red-500 border border-red-100';
                actionLabel = 'requested updates / changes';
              }

              return (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-[-21px] top-0.5 w-2 h-2 rounded-full border-2 bg-white ${
                    log.action === 'review_approved' ? 'border-emerald-500' : log.action === 'review_changes_requested' ? 'border-red-500' : 'border-aws-orange'
                  }`} />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-aws-slate text-xs">{log.user?.name || 'User'}</span>
                      <span className="text-aws-gray-500 text-[11px]">{actionLabel}</span>
                    </div>
                    {log.task && (
                      <button
                        onClick={() => onSelectTask(log.task.id)}
                        className="text-[10px] font-bold text-aws-orange hover:underline text-left block"
                      >
                        Task: {log.task.name}
                      </button>
                    )}
                    <span className="text-[10px] text-aws-gray-400 block">{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              );
            })}

            {filteredActivities.length === 0 && (
              <div className="text-center py-8 text-aws-gray-400">
                No recent workspace activities to display.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
