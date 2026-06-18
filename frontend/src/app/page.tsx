'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/lib/user-context';
import { api } from '@/lib/api';
import type { Task, CrewMember, TaskStatus, Priority, TaskCategory } from '@/lib/types';
import { formatDate, getInitials } from '@/lib/utils';
import { 
  Plus, 
  ChevronDown, 
  User, 
  Shield, 
  Check, 
  Activity as ActivityIcon, 
  Calendar, 
  Layers,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

// Workspace Components
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WorkOverview } from '@/components/workspace/WorkOverview';
import { TaskWorkspace } from '@/components/workspace/TaskWorkspace';
import { TaskDetailDrawer } from '@/components/workspace/TaskDetailDrawer';
import { ReviewsWorkspace } from '@/components/workspace/ReviewsWorkspace';
import { AnalyticsWorkspace } from '@/components/workspace/AnalyticsWorkspace';
import { CrewWorkspace } from '@/components/workspace/CrewWorkspace';
import { TaskCreationPanel } from '@/components/workspace/TaskCreationPanel';
import { CrewCreationPanel } from '@/components/workspace/CrewCreationPanel';

export default function WorkspacePage() {
  const { currentUser, users, setCurrentUserById, isLoading: userContextLoading } = useUser();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Task list and view states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskViewMode, setTaskViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  
  // Data lists
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Overlay states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskCreationOpen, setIsTaskCreationOpen] = useState(false);
  const [isCrewCreationOpen, setIsCrewCreationOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const isCore = currentUser?.role === 'core';

  // Available tabs based on active developer identity role
  const workspaceTabs = useMemo(() => {
    if (isCore) {
      return ['Overview', 'Tasks', 'Reviews', 'Activity', 'Crew', 'Analytics'];
    } else {
      return ['Overview', 'My Work', 'Submitted Updates', 'History'];
    }
  }, [isCore]);

  // Handle identity switch - default to action-oriented Work Overview
  useEffect(() => {
    setActiveTab('Overview');
    setIsWorkspaceMenuOpen(false);
  }, [currentUser]);

  // Core API loader
  const loadWorkspaceData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      if (isCore) {
        // Fetch All tasks
        const tasksRes = await api.getTasks({ limit: 150 });
        setTasks(tasksRes.data);

        // Fetch Review Queue
        const queueRes = await api.getReviewQueue();
        setReviewQueue(queueRes);

        // Fetch Recent Activity
        const activityRes = await api.getDashboardRecentActivity();
        setActivityFeed(activityRes);

        // Fetch Analytics
        const analyticsRes = await api.getAnalytics();
        setAnalyticsData(analyticsRes);

        // Fetch Crew List
        const crewRes = await api.getCrew({ includeInactive: true });
        setCrewList(crewRes.data);
      } else {
        // Crew Mode: Fetch tasks assigned to current user
        const tasksRes = await api.getTasks({ assigneeId: currentUser.id, limit: 100 });
        setTasks(tasksRes.data);

        // Fetch personal activity logs
        const activityRes = await api.getDashboardRecentActivity();
        // Filter activity logs relating to current user's tasks
        const filteredActivity = activityRes.filter((log: any) => log.task?.assignedToId === currentUser.id || log.userId === currentUser.id);
        setActivityFeed(filteredActivity);
      }
    } catch (err) {
      console.error('Failed to load workspace data', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [currentUser]);

  // Filter tasks based on navigation context
  const contextTasks = useMemo(() => {
    if (isCore) {
      return tasks; // All tasks for Core Workspace
    }
    
    // For Crew members:
    if (activeTab === 'My Work') {
      // Show active (uncompleted) tasks assigned to them
      return tasks.filter(t => t.status !== 'completed');
    }
    if (activeTab === 'Submitted Updates') {
      // Tasks currently undergoing review
      return tasks.filter(t => t.status === 'under_review');
    }
    if (activeTab === 'History') {
      // Tasks completed by them
      return tasks.filter(t => t.status === 'completed');
    }
    return tasks;
  }, [tasks, activeTab, isCore]);

  // Actions handlers
  const handleAssignTask = async (data: {
    taskName: string;
    category: TaskCategory;
    priority: Priority;
    assignedTo: CrewMember;
    startDate: string;
    dueDate: string;
    notes: string;
  }) => {
    try {
      await api.createTask({
        name: data.taskName,
        category: data.category,
        priority: data.priority,
        assignedToId: data.assignedTo.id,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
      });
      loadWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCrew = async (data: { name: string; email: string; department?: string }) => {
    try {
      await api.createCrew(data);
      loadWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivateCrew = async (id: string, name: string) => {
    try {
      await api.deactivateCrew(id, name);
      loadWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  if (userContextLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-aws-orange border-t-transparent animate-spin" />
          <span className="text-xs text-aws-gray-500 font-semibold">Configuring Workspace Identity...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Workspace Toolbar Context Control Row */}
        <div className="flex items-center justify-between border-b border-aws-gray-200 pb-3 flex-wrap gap-4">
          <div className="flex items-center gap-3 relative">
            {/* Identity Dropdown Menu selector */}
            <div className="relative">
              <button
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-aws-gray-200 bg-white hover:bg-aws-gray-50 shadow-sm transition-all cursor-pointer font-bold text-xs text-aws-slate"
              >
                {currentUser?.role === 'core' ? (
                  <Shield size={14} className="text-aws-orange" />
                ) : (
                  <User size={14} className="text-aws-gray-500" />
                )}
                <span>
                  {currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Select Operator'}
                </span>
                <ChevronDown size={13} className={`text-aws-gray-400 transition-transform ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isWorkspaceMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsWorkspaceMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute left-0 mt-1.5 w-60 bg-white border border-aws-gray-200 shadow-xl rounded-xl py-1.5 z-50 max-h-72 overflow-y-auto"
                    >
                      <div className="px-3.5 py-1.5 border-b border-aws-gray-100 text-[9px] font-bold text-aws-gray-400 uppercase tracking-wider">
                        Select Workspace Context
                      </div>
                      {users.map(u => {
                        const isSelected = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setCurrentUserById(u.id);
                              setIsWorkspaceMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer border-b border-aws-gray-50/50 last:border-0 hover:bg-aws-gray-50 ${
                              !u.isActive ? 'text-aws-gray-400 opacity-60 bg-aws-gray-50/40' : 'text-aws-slate'
                            }`}
                          >
                            <span className={`text-xs truncate ${isSelected ? 'font-bold text-aws-orange' : 'font-semibold'}`}>
                              {u.name} ({u.role.toUpperCase()}{!u.isActive ? ' - INACTIVE' : ''})
                            </span>
                            {isSelected && <Check size={13} className="text-aws-orange" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" title="API Connected" />
          </div>

          {/* Navigation Tab Pills */}
          <div className="flex items-center gap-1.5 bg-aws-gray-100 p-0.5 rounded-xl border border-aws-gray-200">
            {workspaceTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-aws-slate shadow-sm'
                    : 'text-aws-gray-500 hover:text-aws-slate'
                }`}
              >
                {tab === 'Tasks' && isCore ? 'Task Board' : tab === 'Crew' ? 'Crew Directory' : tab}
              </button>
            ))}
          </div>

          {/* Context Actions */}
          <div>
            {isCore && (activeTab === 'Tasks' || activeTab === 'Overview') && (
              <button
                onClick={() => setIsTaskCreationOpen(true)}
                className="px-3.5 py-1.5 bg-aws-orange hover:bg-aws-orange-dark text-white rounded-lg text-xs font-bold shadow-md shadow-aws-orange/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} /> Allocate Task
              </button>
            )}
          </div>
        </div>

        {/* Workspace Body */}
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-20 text-aws-gray-400">
            <div className="w-6 h-6 rounded-full border border-aws-slate border-t-transparent animate-spin mb-3" />
            <p className="text-xs">Loading operational state...</p>
          </div>
        ) : (
          <div className="relative">
            {/* 1. WORK OVERVIEW TAB */}
            {activeTab === 'Overview' && (
              <WorkOverview
                tasks={tasks}
                reviewQueue={reviewQueue}
                activityFeed={activityFeed}
                currentUser={currentUser}
                onSelectTask={(id) => setSelectedTaskId(id)}
                onSwitchTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* 2. TASKS / MY WORK / COMPLETED HISTORY / SUBMITTED REVIEWS */}
            {(activeTab === 'Tasks' || activeTab === 'My Work' || activeTab === 'Submitted Updates' || activeTab === 'History') && (
              <TaskWorkspace
                tasks={contextTasks}
                viewMode={taskViewMode}
                onViewModeChange={(mode) => setTaskViewMode(mode)}
                onSelectTask={(id) => setSelectedTaskId(id)}
                isCore={isCore}
              />
            )}

            {/* 3. CORE REVIEW QUEUE */}
            {isCore && activeTab === 'Reviews' && (
              <ReviewsWorkspace
                reviewQueue={reviewQueue}
                onRefresh={loadWorkspaceData}
                onSelectTask={(id) => setSelectedTaskId(id)}
              />
            )}

            {/* 4. ACTIVITY TIMELINE */}
            {activeTab === 'Activity' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="pb-2 border-b border-aws-gray-200">
                  <h3 className="text-sm font-bold text-aws-slate uppercase tracking-wider">Audit logs Timeline</h3>
                  <p className="text-xs text-aws-gray-500 mt-0.5">Chronological audit logs of task changes, reviews, and edits.</p>
                </div>
                <div className="bg-white border border-aws-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="relative border-l border-aws-gray-150 pl-5 ml-3 space-y-5 text-xs py-2">
                    {activityFeed.map((log) => {
                      let colorStyle = 'bg-aws-gray-55 text-aws-gray-650';
                      if (log.action === 'created') colorStyle = 'bg-blue-50 text-blue-600 border border-blue-200';
                      else if (log.action === 'assigned') colorStyle = 'bg-purple-50 text-purple-650 border border-purple-200';
                      else if (log.action === 'work_submitted') colorStyle = 'bg-orange-50 text-aws-orange border border-aws-orange-light/25';
                      else if (log.action === 'review_approved') colorStyle = 'bg-emerald-50 text-emerald-600 border border-emerald-250';
                      else if (log.action === 'review_changes_requested') colorStyle = 'bg-red-50 text-red-650 border border-red-200';
                      else if (log.action === 'comment_added') colorStyle = 'bg-teal-50 text-teal-600 border border-teal-200';

                      return (
                        <div key={log.id} className="relative group">
                          {/* Absolute dot indicator */}
                          <div className="absolute left-[-26px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-aws-orange flex items-center justify-center" />
                          
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-aws-slate">{log.user?.name || 'System'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${colorStyle}`}>
                                {log.action.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-aws-gray-400">{formatDate(log.createdAt)}</span>
                            </div>
                            {log.task && (
                              <button
                                onClick={() => setSelectedTaskId(log.task.id)}
                                className="text-[10px] font-bold text-aws-orange hover:underline text-left"
                              >
                                Task: {log.task.name}
                              </button>
                            )}
                            {log.metadata?.comment && (
                              <p className="text-[10px] text-aws-gray-500 italic mt-0.5">
                                "{log.metadata.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {activityFeed.length === 0 && (
                      <div className="text-center py-12 text-aws-gray-400">
                        No activity records logged in workspace.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. CREW DIRECTORY */}
            {isCore && activeTab === 'Crew' && (
              <CrewWorkspace
                crewList={crewList}
                onOpenAddCrew={() => setIsCrewCreationOpen(true)}
                onDeactivateCrew={handleDeactivateCrew}
                isCore={isCore}
              />
            )}

            {/* 6. ANALYTICS */}
            {isCore && activeTab === 'Analytics' && (
              <AnalyticsWorkspace
                analyticsData={analyticsData}
                onSelectTask={(id) => setSelectedTaskId(id)}
              />
            )}
          </div>
        )}
      </div>

      {/* OVERLAY PANEL 1: Task Assignment slide-over */}
      {isCore && (
        <TaskCreationPanel
          isOpen={isTaskCreationOpen}
          onClose={() => setIsTaskCreationOpen(false)}
          crewList={crewList}
          onAssign={handleAssignTask}
        />
      )}

      {/* OVERLAY PANEL 2: Crew Enrollment slide-over */}
      {isCore && (
        <CrewCreationPanel
          isOpen={isCrewCreationOpen}
          onClose={() => setIsCrewCreationOpen(false)}
          onCreateCrew={handleCreateCrew}
        />
      )}

      {/* OVERLAY PANEL 3: Fullscreen Workspace details Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={loadWorkspaceData}
      />

    </DashboardLayout>
  );
}
