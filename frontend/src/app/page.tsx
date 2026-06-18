'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TaskAssignmentForm } from '@/components/dashboard/TaskAssignmentForm';
import { TaskTable } from '@/components/dashboard/TaskTable';
import { TaskDetailsModal } from '@/components/dashboard/TaskDetailsModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { useUser } from '@/lib/user-context';
import { api } from '@/lib/api';
import type { Task, TaskStatus, TaskCategory, Priority, CrewMember } from '@/lib/types';
import { CATEGORIES, PRIORITIES, STATUSES } from '@/lib/types';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Kanban,
  Search,
  Filter,
  Shield,
  Activity as ActivityIcon,
  Users,
  BarChart3,
  Calendar,
  AlertTriangle,
  Archive,
  Check,
  X,
  FileText,
  Paperclip,
  TrendingUp,
  AlertCircle,
  Plus,
  UserX,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatDate, getInitials, isOverdue } from '@/lib/utils';


export default function DashboardPage() {
  const { currentUser, users, isLoading: userContextLoading } = useUser();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('');

  // Task Filters & Views
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskView, setTaskView] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Data states
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [crewWorkloads, setCrewWorkloads] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Crew Management states
  const [isAddingCrew, setIsAddingCrew] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewEmail, setNewCrewEmail] = useState('');
  const [newCrewDept, setNewCrewDept] = useState('');

  // Review Dialog quick feedback
  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'changes_requested'>('approved');
  const [reviewComment, setReviewComment] = useState('');

  const isCore = currentUser?.role === 'core';

  // Dynamic Workspace Tabs
  const workspaceTabs = useMemo(() => {
    if (isCore) {
      return ['All Tasks', 'Reviews', 'Activity', 'Crew', 'Analytics'];
    } else {
      return ['My Tasks', 'Submitted Updates', 'Review Feedback'];
    }
  }, [isCore]);

  // Set default tabs on identity shift
  useEffect(() => {
    if (isCore) {
      setActiveTab('All Tasks');
    } else {
      setActiveTab('My Tasks');
    }
  }, [currentUser, isCore]);

  const fetchData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      if (isCore) {
        // Fetch All Tasks (Core includes showArchived filter if active)
        const tasksRes = await api.getTasks({
          limit: 200,
          includeArchived: showArchived ? 'true' : undefined
        } as any);
        setTasks(tasksRes.data);

        // Fetch Dashboard Summary & workloads
        const [sumRes, workloadsRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getDashboardWorkloads()
        ]);
        setSummary(sumRes);
        setCrewWorkloads(workloadsRes);

        // Fetch Review Queue
        const queueRes = await api.getReviewQueue();
        setReviewQueue(queueRes);

        // Fetch Activity Log
        const activityRes = await api.getDashboardRecentActivity();
        setActivityFeed(activityRes);

        // Fetch detailed analytics
        const analyticsRes = await api.getAnalytics();
        setAnalyticsData(analyticsRes);
      } else {
        // Crew Mode: Fetch assigned tasks
        const tasksRes = await api.getTasks({ assigneeId: currentUser.id, limit: 100 });
        setTasks(tasksRes.data);
        setSummary(null);
      }
    } catch (err) {
      console.error('Failed to load workspace data', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, showArchived]);

  // Filtered Task Collection
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesAssignee = filterAssignee === 'all' || task.assignedTo?.id === filterAssignee;
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchQuery, filterCategory, filterPriority, filterStatus, filterAssignee]);

  // Split tasks into Kanban boards columns
  const kanbanColumns = useMemo(() => {
    const cols: Record<string, Task[]> = {
      yet_to_start: [],
      in_progress: [],
      under_review: [],
      blocked: [],
      completed: []
    };
    
    filteredTasks.forEach(task => {
      // Map statuses nicely
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
  }, [filteredTasks]);

  // Crew specific filtered tasks
  const submittedUpdates = useMemo(() => {
    // Tasks that the crew member has submitted updates for
    return tasks.filter(t => t.status === 'under_review');
  }, [tasks]);

  const reviewFeedbackTasks = useMemo(() => {
    // Tasks in Blocked state (Core requested changes)
    return tasks.filter(t => t.status === 'blocked');
  }, [tasks]);

  const stats = useMemo(() => {
    if (isCore && summary) {
      return {
        assigned: tasks.filter(t => t.assignedTo !== null).length,
        completed: summary.completedTasks,
        pending: summary.activeTasks,
        overdue: summary.overdueTasks
      };
    } else {
      return {
        assigned: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status !== 'completed').length,
        overdue: tasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length
      };
    }
  }, [isCore, summary, tasks]);

  const handleAssign = async (data: {
    taskName: string;
    category: TaskCategory;
    priority: Priority;
    assignedTo: any;
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
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (taskId: string, status: TaskStatus) => {
    try {
      await api.updateTaskStatus(taskId, status);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to soft delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName || !newCrewEmail) return;
    try {
      await api.createCrew({
        name: newCrewName,
        email: newCrewEmail,
        department: newCrewDept || undefined
      });
      setNewCrewName('');
      setNewCrewEmail('');
      setNewCrewDept('');
      setIsAddingCrew(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivateCrew = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate crew member ${name}?`)) return;
    try {
      await api.deactivateCrew(id, name);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingTaskId || !reviewComment.trim()) return;
    try {
      await api.submitReviewDecision(reviewingTaskId, {
        decision: reviewDecision,
        comment: reviewComment
      });
      setReviewingTaskId(null);
      setReviewComment('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (userContextLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-aws-gray-500 font-semibold flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-aws-orange border-t-transparent animate-spin" />
            <span>Verifying authenticated credentials...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header containing Developer User Context Selection */}
        <Header
          title={isCore ? "Task Operations Workspace" : "Crew Operations Panel"}
          subtitle={isCore ? "Core Team Operations — AWS SBG REC" : "My Assignments, Work updates, & Reviews Feedback"}
        />

        {/* Global summary stats banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <StatCard
            label={isCore ? "Assigned Tasks" : "My Tasks"}
            value={stats.assigned}
            icon={<UserCheck size={16} />}
            color="info"
          />
          <StatCard
            label="Completed Tasks"
            value={stats.completed}
            icon={<CheckCircle2 size={16} />}
            color="success"
          />
          <StatCard
            label="Pending Tasks"
            value={stats.pending}
            icon={<Clock size={16} />}
            color="warning"
          />
          <StatCard
            label="Overdue Tasks"
            value={stats.overdue}
            icon={<AlertTriangle size={16} />}
            color="error"
          />
        </div>

        {/* TOP LEVEL NAVIGATION TABS (No Sidebars or Rails) */}
        <div className="flex border-b border-aws-gray-200 bg-white/50 backdrop-blur-sm p-1 rounded-xl gap-2 overflow-x-auto select-none border">
          {workspaceTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-aws-orange text-white shadow-md shadow-aws-orange/25'
                  : 'text-aws-gray-650 hover:bg-aws-gray-100 hover:text-aws-slate'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: ALL TASKS / MY TASKS */}
        {(activeTab === 'All Tasks' || activeTab === 'My Tasks') && (
          <div className="space-y-4">
            {/* Filter and layout adjustments panel */}
            <div className="bg-white/80 backdrop-blur border border-aws-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-aws-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-9 pr-4 py-2 border border-aws-gray-200 rounded-xl bg-white/50 text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/20 focus:border-aws-orange/30"
                  />
                </div>
                
                {/* Grid/List/Kanban view switchers */}
                <div className="flex rounded-xl border border-aws-gray-200 bg-aws-gray-50/50 p-0.5">
                  <button
                    onClick={() => setTaskView('grid')}
                    className={`p-2 rounded-lg cursor-pointer ${taskView === 'grid' ? 'bg-white text-aws-orange shadow-sm' : 'text-aws-gray-500'}`}
                    title="Grid View"
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setTaskView('list')}
                    className={`p-2 rounded-lg cursor-pointer ${taskView === 'list' ? 'bg-white text-aws-orange shadow-sm' : 'text-aws-gray-500'}`}
                    title="List View"
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setTaskView('kanban')}
                    className={`p-2 rounded-lg cursor-pointer ${taskView === 'kanban' ? 'bg-white text-aws-orange shadow-sm' : 'text-aws-gray-500'}`}
                    title="Kanban Board"
                  >
                    <Kanban size={14} />
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap gap-2.5 items-center text-xs">
                <div className="flex items-center gap-1.5 bg-aws-gray-50 px-2 py-1 rounded-lg border border-aws-gray-200">
                  <Filter size={11} className="text-aws-gray-400" />
                  <span className="text-[10px] text-aws-gray-550 uppercase font-bold tracking-wider">Filters:</span>
                </div>

                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>

                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white"
                >
                  <option value="all">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white"
                >
                  <option value="all">All Statuses</option>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                {isCore && (
                  <>
                    <select
                      value={filterAssignee}
                      onChange={e => setFilterAssignee(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white"
                    >
                      <option value="all">All Assignees</option>
                      {users.filter(u => u.role === 'crew').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1.5 select-none bg-aws-slate/5 px-2.5 py-1.5 rounded-lg border border-aws-gray-200 hover:bg-aws-slate/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={e => setShowArchived(e.target.checked)}
                        className="accent-aws-orange"
                      />
                      <span>Show Archived Tasks</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Layout forms for assignment + list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Task listing viewport (occupies 2 cols if creator form active) */}
              <div className={isCore && activeTab === 'All Tasks' ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
                {/* GRID VIEW */}
                {taskView === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTasks.map(task => {
                      const isTaskOverdue = isOverdue(task.dueDate) && task.status !== 'completed';
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="glass-card p-4 rounded-xl cursor-pointer transition-all border border-aws-gray-150 flex flex-col justify-between min-h-[140px]"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1 text-[10px]">
                              <span
                                className="font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: `${CATEGORIES.find(c => c.value === task.category)?.color}12`,
                                  color: CATEGORIES.find(c => c.value === task.category)?.color,
                                }}
                              >
                                {CATEGORIES.find(c => c.value === task.category)?.label}
                              </span>
                              <PriorityBadge priority={task.priority} />
                            </div>
                            <h4 className="text-sm font-bold text-aws-slate truncate">{task.name}</h4>
                            <p className="text-xs text-aws-gray-500 line-clamp-2 mt-1 leading-normal">
                              {task.notes || 'No description logged.'}
                            </p>
                          </div>

                          <div className="border-t border-aws-gray-100 pt-3 mt-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-aws-gray-500">
                              <Calendar size={11} />
                              <span className={isTaskOverdue ? 'text-red-500 font-bold' : ''}>{formatDate(task.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={task.status} />
                              <span className="font-bold text-aws-orange">{task.progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredTasks.length === 0 && (
                      <div className="col-span-2 text-center py-20 border rounded-xl border-dashed border-aws-gray-250 bg-white/50">
                        <FileText size={32} className="text-aws-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-aws-gray-400">No tasks match selected filter criteria.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* LIST VIEW */}
                {taskView === 'list' && (
                  <div className="bg-white border border-aws-gray-150 rounded-xl overflow-hidden shadow-sm">
                    <TaskTable
                      tasks={filteredTasks}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={handleDelete}
                      isCore={isCore}
                      onRowClick={(task) => setSelectedTaskId(task.id)}
                    />
                  </div>
                )}

                {/* READ-ONLY KANBAN BOARD */}
                {taskView === 'kanban' && (
                  <div className="flex gap-3 overflow-x-auto pb-4 select-none">
                    {(Object.keys(kanbanColumns) as Array<keyof typeof kanbanColumns>).map(colKey => {
                      const colTasks = kanbanColumns[colKey];
                      const titleMap: Record<string, string> = {
                        yet_to_start: 'To Do',
                        in_progress: 'In Progress',
                        under_review: 'Under Review',
                        blocked: 'Changes Requested',
                        completed: 'Completed'
                      };

                      const badgeColors: Record<string, string> = {
                        yet_to_start: 'bg-aws-gray-100 text-aws-gray-600',
                        in_progress: 'bg-aws-orange/10 text-aws-orange',
                        under_review: 'bg-purple-100 text-purple-650',
                        blocked: 'bg-red-50 text-red-600',
                        completed: 'bg-emerald-50 text-emerald-600'
                      };

                      return (
                        <div key={colKey} className="w-72 flex-shrink-0 bg-aws-gray-50/50 border border-aws-gray-150 rounded-xl p-3 flex flex-col max-h-[500px]">
                          <div className="flex items-center justify-between mb-3 border-b border-aws-gray-150 pb-2">
                            <span className="text-xs font-bold text-aws-slate flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${colKey === 'completed' ? 'bg-emerald-500' : colKey === 'blocked' ? 'bg-red-500' : 'bg-aws-orange'}`} />
                              {titleMap[colKey]}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColors[colKey]}`}>{colTasks.length}</span>
                          </div>

                          <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                            {colTasks.map(task => (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className="bg-white border border-aws-gray-100 hover:border-aws-orange/30 p-3 rounded-lg shadow-sm cursor-pointer hover:shadow transition-all space-y-2"
                              >
                                <span className="text-[9px] bg-aws-slate/5 text-aws-slate font-bold px-1.5 py-0.5 rounded-full uppercase">
                                  {task.category.replace('_', ' ')}
                                </span>
                                <h5 className="text-xs font-bold text-aws-slate line-clamp-1">{task.name}</h5>
                                <div className="flex items-center justify-between text-[10px] text-aws-gray-400">
                                  <span>{formatDate(task.dueDate)}</span>
                                  <span className="font-semibold text-aws-orange">{task.progress}%</span>
                                </div>
                              </div>
                            ))}
                            {colTasks.length === 0 && (
                              <div className="text-center py-12 text-[10px] text-aws-gray-400">
                                No tasks in list.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assignment Form (Core only, right sidebar) */}
              {isCore && activeTab === 'All Tasks' && (
                <div className="space-y-4">
                  <TaskAssignmentForm onAssign={handleAssign} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REVIEWS QUEUE (Core restricted workspace) */}
        {isCore && activeTab === 'Reviews' && (
          <div className="space-y-4">
            <SectionHeader
              title="Awaiting Review Queue"
              subtitle="Designated workspace for validating crew submissions and assessing task completion quality."
            />

            <div className="bg-white border border-aws-gray-150 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-aws-gray-50 border-b border-aws-gray-150 font-bold text-aws-slate">
                    <th className="p-3">Task Details</th>
                    <th className="p-3">Submitter</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">SLA Status</th>
                    <th className="p-3">Time Submitted</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aws-gray-100">
                  {reviewQueue.map(item => (
                    <tr key={item.id} className="hover:bg-aws-gray-50/50 transition-colors">
                      <td className="p-3 cursor-pointer" onClick={() => setSelectedTaskId(item.id)}>
                        <div className="font-bold text-aws-slate hover:underline">{item.name}</div>
                        <div className="text-[10px] text-aws-gray-400 mt-0.5">{item.category.replace('_', ' ').toUpperCase()}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full gradient-slate flex items-center justify-center text-[8px] font-bold text-white">
                            {getInitials(item.assignedTo?.name || 'C')}
                          </div>
                          <span>{item.assignedTo?.name || 'Crew Member'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-aws-orange">{item.progress}%</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          item.sla === 'fresh'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : item.sla === 'waiting'
                            ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                            : 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                        }`}>
                          {item.sla}
                        </span>
                      </td>
                      <td className="p-3 text-aws-gray-500">
                        {item.submittedAt ? formatDate(item.submittedAt) : 'Not Specified'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setReviewingTaskId(item.id);
                            setReviewDecision('approved');
                          }}
                          className="px-2.5 py-1 bg-aws-slate hover:bg-aws-slate-light text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                          Quick Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {reviewQueue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-aws-gray-400">
                        <CheckCircle2 size={32} className="text-aws-gray-300 mx-auto mb-2" />
                        No submissions currently awaiting review in the queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL ACTIVITY FEED */}
        {isCore && activeTab === 'Activity' && (
          <div className="space-y-4">
            <SectionHeader
              title="Audit Activity Timeline"
              subtitle="Full chronicle story of task assignments, submissions, review decisions, and lifecycle edits."
            />

            <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm max-w-4xl mx-auto space-y-4">
              <div className="relative border-l border-aws-gray-150 pl-5 ml-3 space-y-5 text-xs py-2">
                {activityFeed.map((log) => {
                  let badgeColor = 'bg-aws-gray-100 text-aws-gray-650';
                  if (log.action === 'created') badgeColor = 'bg-blue-50 text-blue-600 border border-blue-200';
                  else if (log.action === 'assigned' || log.action === 'reassigned') badgeColor = 'bg-purple-50 text-purple-600 border border-purple-200';
                  else if (log.action === 'work_submitted') badgeColor = 'bg-orange-50 text-aws-orange border border-aws-orange-light/20';
                  else if (log.action === 'review_approved') badgeColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                  else if (log.action === 'review_changes_requested') badgeColor = 'bg-red-50 text-red-650 border border-red-200';
                  else if (log.action === 'comment_added') badgeColor = 'bg-teal-50 text-teal-600 border border-teal-200';
                  else if (log.action === 'archived') badgeColor = 'bg-aws-slate text-white';

                  return (
                    <div key={log.id} className="relative group">
                      <div className="absolute left-[-26px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-aws-orange flex items-center justify-center" />
                      
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-aws-slate">{log.user?.name || 'System Operator'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${badgeColor}`}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-aws-gray-400">{formatDate(log.createdAt)}</span>
                        </div>
                        {log.task && (
                          <span
                            onClick={() => setSelectedTaskId(log.task.id)}
                            className="text-[10px] font-semibold text-aws-orange hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            Task: {log.task.name}
                          </span>
                        )}
                        {log.metadata && (
                          <p className="text-[10px] text-aws-gray-500 italic mt-0.5">
                            {log.metadata.comment && `"${log.metadata.comment}"`}
                            {log.metadata.newStatus && `Status transitioned to ${log.metadata.newStatus}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {activityFeed.length === 0 && (
                  <div className="text-center py-12 text-aws-gray-400">
                    No global activity logs recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREW MANAGEMENT */}
        {isCore && activeTab === 'Crew' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <SectionHeader
                title="Crew Operations & Workloads"
                subtitle="Assign tasks, monitor workloads, and manage active builder group crew members."
              />
              <button
                onClick={() => setIsAddingCrew(!isAddingCrew)}
                className="px-3 py-1.5 bg-aws-orange hover:bg-aws-orange-dark text-white rounded-lg text-xs font-bold shadow-md shadow-aws-orange/20 cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={13} /> Add Crew Member
              </button>
            </div>

            {/* Modal Add Crew Form */}
            {isAddingCrew && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-aws-gray-200 bg-white/90 p-4 rounded-xl max-w-md shadow-lg space-y-3 text-xs"
              >
                <h4 className="font-bold text-aws-slate border-b border-aws-gray-100 pb-1 flex items-center justify-between">
                  <span>Register Crew Member</span>
                  <button onClick={() => setIsAddingCrew(false)} className="text-aws-gray-400 hover:text-aws-slate cursor-pointer"><X size={14} /></button>
                </h4>
                <form onSubmit={handleAddCrew} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-aws-gray-500 uppercase">Full Name</label>
                    <input
                      required
                      type="text"
                      value={newCrewName}
                      onChange={e => setNewCrewName(e.target.value)}
                      placeholder="Sam Dev"
                      className="w-full border border-aws-gray-200 p-2 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-aws-gray-500 uppercase">Email Address</label>
                    <input
                      required
                      type="email"
                      value={newCrewEmail}
                      onChange={e => setNewCrewEmail(e.target.value)}
                      placeholder="samdev@builder.edu"
                      className="w-full border border-aws-gray-200 p-2 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-aws-gray-500 uppercase">Department</label>
                    <input
                      type="text"
                      value={newCrewDept}
                      onChange={e => setNewCrewDept(e.target.value)}
                      placeholder="Events Coordination"
                      className="w-full border border-aws-gray-200 p-2 rounded-lg bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-aws-orange hover:bg-aws-orange-dark text-white font-bold rounded-lg cursor-pointer"
                  >
                    Confirm Registration
                  </button>
                </form>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {crewWorkloads.map((crew: any) => {
                const workloadColors = {
                  available: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
                  busy: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
                  overloaded: 'bg-red-50 text-red-650 border border-red-200'
                };

                return (
                  <div key={crew.crewId} className="border border-aws-gray-150 rounded-xl p-4 bg-white/70 shadow-sm relative flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white">
                            {getInitials(crew.name)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-aws-slate">{crew.name}</span>
                            <span className="text-[10px] text-aws-gray-400 block">{crew.department || 'General crew'}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${workloadColors[crew.workloadStatus as keyof typeof workloadColors] || 'bg-gray-100'}`}>
                          {crew.workloadStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-b border-aws-gray-100 my-2">
                        <div>
                          <span className="text-[10px] text-aws-gray-400 block">Active</span>
                          <span className="font-bold text-aws-slate">{crew.activeTaskCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-aws-gray-400 block">Completed</span>
                          <span className="font-bold text-aws-slate">{crew.completedTaskCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-aws-gray-400 block">Overdue</span>
                          <span className={`font-bold ${crew.overdueTaskCount > 0 ? 'text-red-500' : 'text-aws-slate'}`}>{crew.overdueTaskCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-[10px] mt-2">
                      <button
                        onClick={() => handleDeactivateCrew(crew.crewId, crew.name)}
                        className="px-2 py-1 border border-aws-gray-200 hover:bg-red-50 hover:text-red-650 rounded-lg text-aws-gray-500 cursor-pointer transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: ANALYTICS (Core restricted workspace metrics dashboard) */}
        {isCore && activeTab === 'Analytics' && analyticsData && (
          <div className="space-y-5">
            <SectionHeader
              title="Operational Insights & Timestamps Metrics"
              subtitle="Turnaround averages, backlog workload constraints, and queue bottlenecks computed in real-time."
            />

            {/* Stat counts banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-aws-orange/10 flex items-center justify-center text-aws-orange"><Clock size={18} /></div>
                <div>
                  <span className="text-aws-gray-500 block">Avg Completion Time</span>
                  <span className="text-lg font-bold text-aws-slate">{analyticsData.averageCompletionTimeHours} hours</span>
                </div>
              </div>
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-aws-orange/10 flex items-center justify-center text-aws-orange"><Shield size={18} /></div>
                <div>
                  <span className="text-aws-gray-500 block">Avg Review Turnaround</span>
                  <span className="text-lg font-bold text-aws-slate">{analyticsData.averageReviewTimeHours} hours</span>
                </div>
              </div>
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-aws-orange/10 flex items-center justify-center text-aws-orange"><AlertCircle size={18} /></div>
                <div>
                  <span className="text-aws-gray-500 block">Overdue Backlog Tasks</span>
                  <span className="text-lg font-bold text-red-500">{analyticsData.bottlenecks.overdueCount} tasks</span>
                </div>
              </div>
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-aws-orange/10 flex items-center justify-center text-aws-orange"><Users size={18} /></div>
                <div>
                  <span className="text-aws-gray-500 block">Busy / Overloaded Staff</span>
                  <span className="text-lg font-bold text-aws-slate">
                    {analyticsData.workloadDistribution.busy + analyticsData.workloadDistribution.overloaded} crew
                  </span>
                </div>
              </div>
            </div>

            {/* Professional Recharts charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category distribution Pie Chart */}
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-aws-slate flex items-center gap-1"><TrendingUp size={14} className="text-aws-orange" /> Task Category Breakdown</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pre Event', value: analyticsData.distributions.byCategory.pre_event || 0, color: '#FF9900' },
                          { name: 'During Event', value: analyticsData.distributions.byCategory.during_event || 0, color: '#232F3E' },
                          { name: 'Post Event', value: analyticsData.distributions.byCategory.post_event || 0, color: '#10B981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[0, 1, 2].map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#FF9900' : index === 1 ? '#232F3E' : '#10B981'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly completions trend Line Chart */}
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-aws-slate flex items-center gap-1"><TrendingUp size={14} className="text-aws-orange" /> Task Completion Trends (Last 7 Days)</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.completionTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" stroke="#FF9900" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Priority distribution Bar Chart */}
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-aws-slate flex items-center gap-1"><BarChart3 size={14} className="text-aws-orange" /> Tasks by Priority</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Low', count: analyticsData.distributions.byPriority.low || 0, color: '#6B7280' },
                      { name: 'Medium', count: analyticsData.distributions.byPriority.medium || 0, color: '#F59E0B' },
                      { name: 'High', count: analyticsData.distributions.byPriority.high || 0, color: '#FF9900' },
                      { name: 'Critical', count: analyticsData.distributions.byPriority.critical || 0, color: '#EF4444' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF9900">
                        {[
                          { color: '#6B7280' },
                          { color: '#F59E0B' },
                          { color: '#FF9900' },
                          { color: '#EF4444' }
                        ].map((c, idx) => (
                          <Cell key={`cell-${idx}`} fill={c.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottlenecks lists */}
              <div className="bg-white border border-aws-gray-150 rounded-xl p-4 shadow-sm space-y-3 text-xs">
                <h4 className="text-xs font-bold text-aws-slate flex items-center gap-1.5"><AlertTriangle size={14} className="text-aws-orange" /> Task Bottlenecks</h4>
                <div className="space-y-2">
                  {analyticsData.bottlenecks.list && analyticsData.bottlenecks.list.length > 0 ? (
                    analyticsData.bottlenecks.list.map((task: any) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-3 border border-aws-gray-150 rounded-xl bg-aws-gray-50/50 hover:bg-aws-gray-50 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-aws-slate block truncate">{task.name}</span>
                          <span className="text-[10px] text-aws-gray-400 block mt-0.5">Due date: {formatDate(task.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                            task.status === 'blocked' ? 'bg-red-100 text-red-650' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {task.status}
                          </span>
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-aws-gray-400 py-12 text-center">No bottlenecks or overdue tasks identified.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CREW MODE SUBMITTED UPDATES */}
        {!isCore && activeTab === 'Submitted Updates' && (
          <div className="space-y-4">
            <SectionHeader
              title="My Submitted Updates"
              subtitle="Pending review approvals or pending feedback validation by Core administrators."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {submittedUpdates.map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="bg-white border border-aws-gray-150 p-4 rounded-xl shadow-sm cursor-pointer hover:shadow transition-shadow flex flex-col justify-between min-h-[120px]"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="font-bold text-aws-orange px-2 py-0.5 rounded-full bg-aws-orange/10 uppercase">
                        {task.category.replace('_', ' ')}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <h4 className="text-xs font-bold text-aws-slate">{task.name}</h4>
                  </div>
                  <div className="border-t border-aws-gray-100 pt-2.5 mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-aws-gray-400">Submitted: {task.dueDate ? formatDate(task.dueDate) : '—'}</span>
                    <span className="bg-purple-50 text-purple-650 border border-purple-250 px-2 py-0.5 rounded-full font-bold">Awaiting Review</span>
                  </div>
                </div>
              ))}
              {submittedUpdates.length === 0 && (
                <div className="col-span-2 text-center py-20 border border-dashed border-aws-gray-250 rounded-xl bg-white">
                  <CheckCircle2 size={32} className="text-aws-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-aws-gray-400">No work updates currently awaiting review.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: CREW MODE REVIEW FEEDBACK */}
        {!isCore && activeTab === 'Review Feedback' && (
          <div className="space-y-4">
            <SectionHeader
              title="Awaiting Revision / Changes Requested"
              subtitle="Tasks that Core administrators have requested updates for before completion approval."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviewFeedbackTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="bg-red-50/20 border border-red-200/50 p-4 rounded-xl cursor-pointer hover:shadow transition-shadow flex flex-col justify-between min-h-[120px]"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="font-bold text-red-650 px-2 py-0.5 rounded-full bg-red-100/55 uppercase">
                        {task.category.replace('_', ' ')}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <h4 className="text-xs font-bold text-aws-slate">{task.name}</h4>
                  </div>
                  <div className="border-t border-red-100 pt-2.5 mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-red-500 flex items-center gap-1 font-semibold"><AlertTriangle size={11} /> Changes Requested</span>
                    <span className="font-bold text-aws-orange">{task.progress}%</span>
                  </div>
                </div>
              ))}
              {reviewFeedbackTasks.length === 0 && (
                <div className="col-span-2 text-center py-20 border border-dashed border-aws-gray-250 rounded-xl bg-white">
                  <ThumbsUp size={32} className="text-aws-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-aws-gray-400">No feedback items or revision requests pending.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task detailed workspace Overlay panel */}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchData}
        />
      )}

      {/* Quick reviews popup dialog */}
      {reviewingTaskId && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-aws-gray-200 rounded-xl p-5 shadow-2xl space-y-4"
          >
            <h4 className="text-xs font-bold text-aws-slate border-b border-aws-gray-100 pb-1.5 flex items-center justify-between">
              <span>Awaiting Review Quick Actions</span>
              <button onClick={() => setReviewingTaskId(null)} className="text-aws-gray-450 hover:text-aws-slate cursor-pointer"><X size={14} /></button>
            </h4>
            <form onSubmit={handleQuickReviewSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-aws-gray-500 uppercase">Review Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('approved')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      reviewDecision === 'approved' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-600 font-bold' 
                        : 'bg-white border-aws-gray-200 text-aws-gray-500'
                    }`}
                  >
                    Approve task
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('changes_requested')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      reviewDecision === 'changes_requested' 
                        ? 'bg-red-50 border-red-300 text-red-650 font-bold' 
                        : 'bg-white border-aws-gray-200 text-aws-gray-500'
                    }`}
                  >
                    Request revisions
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-aws-gray-500 uppercase">Feedback Notes</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Feedback or update guidelines..."
                  className="w-full border border-aws-gray-200 p-2 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-aws-orange hover:bg-aws-orange-dark text-white font-bold rounded-lg cursor-pointer"
              >
                Log Review
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
