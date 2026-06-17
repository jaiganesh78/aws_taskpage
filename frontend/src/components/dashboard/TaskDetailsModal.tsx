'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  User,
  Shield,
  MessageSquare,
  History,
  Activity as ActivityIcon,
  Trash2,
  Plus,
  Sliders,
  CheckCircle2,
  Edit2,
  Tag,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/user-context';
import type { Task, Comment, ProgressHistory, Activity, TaskStatus, Priority, TaskCategory } from '@/lib/types';
import { CATEGORIES, PRIORITIES, STATUSES } from '@/lib/types';
import { formatDate, getInitials, isOverdue } from '@/lib/utils';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';

interface TaskDetailsModalProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailsModal({ taskId, onClose, onUpdate }: TaskDetailsModalProps) {
  const { currentUser } = useUser();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<ProgressHistory[]>([]);
  const [activityLogs, setActivityLogs] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [progressPage, setProgressPage] = useState(1);
  const [hasMoreProgress, setHasMoreProgress] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivity, setHasMoreActivity] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'comments' | 'progress' | 'activity'>('comments');

  // Input states
  const [newComment, setNewComment] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [progressComment, setProgressComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Edit fields (CORE only)
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editCategory, setEditCategory] = useState<TaskCategory>('pre_event');
  const [editAssignedToId, setEditAssignedToId] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [crewList, setCrewList] = useState<any[]>([]);

  const isCore = currentUser?.role === 'core';

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const details = await api.getTaskDetails(taskId);
      setTask(details.task);
      setComments(details.comments);
      setProgressUpdates(details.progressUpdates);
      setActivityLogs(details.activityLogs);
      setNewProgress(details.task.progress);

      // Setup initial edit states
      setEditName(details.task.name);
      setEditNotes(details.task.notes || '');
      setEditPriority(details.task.priority);
      setEditCategory(details.task.category);
      setEditAssignedToId(details.task.assignedTo?.id || 'unassigned');
      setEditDueDate(details.task.dueDate ? new Date(details.task.dueDate).toISOString().split('T')[0] : '');
      setEditStartDate(details.task.startDate ? new Date(details.task.startDate).toISOString().split('T')[0] : '');

      // Check if there are more sub-resources (each findDetails take 10)
      setHasMoreComments(details.comments.length === 10);
      setHasMoreProgress(details.progressUpdates.length === 10);
      setHasMoreActivity(details.activityLogs.length === 10);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    if (isCore) {
      api.getCrew().then(res => setCrewList(res.data)).catch(console.error);
    }
  }, [taskId]);

  const loadMoreComments = async () => {
    const nextPage = commentsPage + 1;
    try {
      const res = await api.getComments(taskId, { page: nextPage, limit: 10 });
      setComments(prev => [...prev, ...res.data]);
      setCommentsPage(nextPage);
      setHasMoreComments(res.data.length === 10);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMoreProgress = async () => {
    const nextPage = progressPage + 1;
    try {
      const res = await api.getProgressHistory(taskId, { page: nextPage, limit: 10 });
      setProgressUpdates(prev => [...prev, ...res.data]);
      setProgressPage(nextPage);
      setHasMoreProgress(res.data.length === 10);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMoreActivity = async () => {
    const nextPage = activityPage + 1;
    try {
      const res = await api.getActivityTimeline(taskId, { page: nextPage, limit: 10 });
      setActivityLogs(prev => [...prev, ...res.data]);
      setActivityPage(nextPage);
      setHasMoreActivity(res.data.length === 10);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateTaskStatus(taskId, newStatus);
      setTask(updated);
      setNewProgress(updated.progress);
      // Refresh timelines
      const details = await api.getTaskDetails(taskId);
      setActivityLogs(details.activityLogs);
      setProgressUpdates(details.progressUpdates);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProgressChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setIsUpdatingProgress(true);
    try {
      const updated = await api.updateTaskProgress(taskId, newProgress, progressComment);
      setTask(updated);
      setProgressComment('');
      // Refresh logs
      const details = await api.getTaskDetails(taskId);
      setProgressUpdates(details.progressUpdates);
      setActivityLogs(details.activityLogs);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await api.addComment(taskId, newComment.trim());
      setComments(prev => [added, ...prev]);
      setNewComment('');
      // Refresh activity logs
      const details = await api.getTaskDetails(taskId);
      setActivityLogs(details.activityLogs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      // Refresh activity logs
      const details = await api.getTaskDetails(taskId);
      setActivityLogs(details.activityLogs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    try {
      const updated = await api.updateTask(taskId, {
        name: editName,
        notes: editNotes,
        priority: editPriority,
        category: editCategory,
        assignedToId: editAssignedToId === 'unassigned' ? null : editAssignedToId,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : null,
        dueDate: new Date(editDueDate).toISOString(),
      });
      setTask(updated);
      setIsEditing(false);
      // Refresh all
      fetchDetails();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (isCore) return true;
    return comment.userId === currentUser?.id;
  };

  if (isLoading && !task) {
    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white/80 p-6 rounded-2xl border border-aws-gray-200 text-aws-slate font-medium shadow-xl">
          Loading task details...
        </div>
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 rounded-2xl border border-aws-gray-200 shadow-2xl p-6 relative flex flex-col md:flex-row gap-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-aws-gray-100 flex items-center justify-center text-aws-gray-500 hover:text-aws-slate transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Metadata, Editing, and Quick Updates */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${CATEGORIES.find(c => c.value === task.category)?.color}12`,
                  color: CATEGORIES.find(c => c.value === task.category)?.color,
                }}
              >
                {CATEGORIES.find(c => c.value === task.category)?.label}
              </span>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {overdue && (
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={10} /> Overdue
                </span>
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full text-lg font-bold text-aws-slate border border-aws-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
              />
            ) : (
              <h2 className="text-xl font-bold text-aws-slate flex items-center gap-2">
                {task.name}
                {isCore && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded hover:bg-aws-gray-50 text-aws-gray-400 hover:text-aws-slate transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </h2>
            )}
          </div>

          <div className="border-t border-aws-gray-100 my-2 pt-2 space-y-2 text-xs">
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-aws-gray-500 font-medium flex items-center gap-1"><User size={11} /> Assignee</span>
              {isEditing ? (
                <select
                  value={editAssignedToId}
                  onChange={e => setEditAssignedToId(e.target.value)}
                  className="p-1 border border-aws-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                >
                  <option value="unassigned">Unassigned</option>
                  {crewList.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.department || 'No Dept'})</option>
                  ))}
                </select>
              ) : task.assignedTo ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full gradient-slate flex items-center justify-center text-[8px] font-bold text-white">
                    {getInitials(task.assignedTo.name)}
                  </div>
                  <span className="font-semibold text-aws-slate">{task.assignedTo.name} ({task.assignedTo.department || 'No Dept'})</span>
                </div>
              ) : (
                <span className="italic text-aws-gray-400">Unassigned</span>
              )}
            </div>

            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-aws-gray-500 font-medium flex items-center gap-1"><Calendar size={11} /> Start Date</span>
              {isEditing ? (
                <input
                  type="date"
                  value={editStartDate}
                  onChange={e => setEditStartDate(e.target.value)}
                  className="p-1 border border-aws-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                />
              ) : (
                <span className="font-medium text-aws-slate">{task.startDate ? formatDate(task.startDate) : 'Not Specified'}</span>
              )}
            </div>

            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-aws-gray-500 font-medium flex items-center gap-1"><Clock size={11} /> Due Date</span>
              {isEditing ? (
                <input
                  type="date"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  className="p-1 border border-aws-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                />
              ) : (
                <span className={`font-semibold ${overdue ? 'text-red-500' : 'text-aws-slate'}`}>{formatDate(task.dueDate)}</span>
              )}
            </div>

            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-aws-gray-500 font-medium flex items-center gap-1"><Shield size={11} /> Assigned By</span>
              <span className="font-medium text-aws-slate">{task.createdBy?.name || 'Core Operations'}</span>
            </div>

            {isEditing && (
              <>
                <div className="grid grid-cols-[80px_1fr] items-center">
                  <span className="text-aws-gray-500 font-medium flex items-center gap-1"><Tag size={11} /> Category</span>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as TaskCategory)}
                    className="p-1 border border-aws-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center">
                  <span className="text-aws-gray-500 font-medium flex items-center gap-1"><AlertTriangle size={11} /> Priority</span>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as Priority)}
                    className="p-1 border border-aws-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                  >
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-aws-gray-600 block">Notes & Requirements</span>
            {isEditing ? (
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={3}
                className="w-full text-xs text-aws-slate border border-aws-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
              />
            ) : (
              <p className="text-xs text-aws-gray-600 bg-aws-gray-50 p-2.5 rounded-lg border border-aws-gray-100 min-h-[50px] leading-relaxed">
                {task.notes || 'No description provided.'}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-aws-gray-200 text-aws-gray-500 hover:bg-aws-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-aws-orange text-white hover:bg-aws-orange-dark shadow transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="border-t border-aws-gray-100 pt-3 space-y-3">
            {/* Status Dropdown */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aws-slate flex items-center gap-1"><Sliders size={12} /> Status Operations</span>
              <select
                disabled={isUpdatingStatus}
                value={task.status}
                onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                className="text-xs font-semibold border border-aws-gray-200 p-1.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-aws-orange/20 cursor-pointer"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Update Form */}
            <form onSubmit={handleProgressChange} className="space-y-2 bg-aws-gray-50/50 p-2.5 rounded-lg border border-aws-gray-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-aws-slate">Progress Meter</span>
                <span className="font-bold text-aws-orange">{newProgress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={newProgress}
                onChange={e => setNewProgress(Number(e.target.value))}
                className="w-full accent-aws-orange h-1 rounded-lg bg-aws-gray-200 cursor-pointer"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={progressComment}
                  onChange={e => setProgressComment(e.target.value)}
                  placeholder="Optional log comments..."
                  className="flex-1 px-2.5 py-1 rounded-lg border border-aws-gray-200 bg-white text-xs placeholder-aws-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isUpdatingProgress || newProgress === task.progress}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-aws-orange text-white hover:bg-aws-orange-dark disabled:bg-aws-gray-200 disabled:text-aws-gray-400 transition-colors cursor-pointer"
                >
                  {isUpdatingProgress ? '...' : 'Log'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed History feed & Comments panel */}
        <div className="flex-1 border-t md:border-t-0 md:border-l border-aws-gray-150 pt-4 md:pt-0 md:pl-6 flex flex-col min-h-[350px]">
          {/* Tab Navigation */}
          <div className="flex border-b border-aws-gray-100 pb-2 mb-3 gap-3">
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-1 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'comments' ? 'text-aws-orange' : 'text-aws-gray-400 hover:text-aws-slate'
              }`}
            >
              Comments ({comments.length})
              {activeTab === 'comments' && (
                <motion.div layoutId="modal-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-aws-orange" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`pb-1 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'progress' ? 'text-aws-orange' : 'text-aws-gray-400 hover:text-aws-slate'
              }`}
            >
              Progress Log
              {activeTab === 'progress' && (
                <motion.div layoutId="modal-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-aws-orange" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-1 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'activity' ? 'text-aws-orange' : 'text-aws-gray-400 hover:text-aws-slate'
              }`}
            >
              Audit Timeline
              {activeTab === 'activity' && (
                <motion.div layoutId="modal-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-aws-orange" />
              )}
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1 text-xs">
            {/* COMMENTS */}
            {activeTab === 'comments' && (
              <div className="space-y-2 flex flex-col h-full justify-between">
                <div className="space-y-2 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-2.5 rounded-lg border border-aws-gray-100 bg-aws-gray-50/50 group/comment relative">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full gradient-slate flex items-center justify-center text-[7px] font-bold text-white">
                            {getInitials(comment.user?.name || comment.userName || 'U')}
                          </div>
                          <span className="font-bold text-aws-slate">{comment.user?.name || comment.userName || 'User'}</span>
                        </div>
                        <span className="text-[9px] text-aws-gray-400">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-aws-gray-600 leading-normal pr-6">{comment.message}</p>
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="absolute right-2 bottom-2 text-aws-gray-300 hover:text-error opacity-0 group-hover/comment:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-aws-gray-400 text-center py-8">No comments yet.</p>
                  )}
                  {hasMoreComments && (
                    <button
                      onClick={loadMoreComments}
                      className="w-full py-1 text-center font-bold text-aws-orange hover:underline cursor-pointer"
                    >
                      Load More Comments
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-aws-gray-100 mt-2">
                  <input
                    type="text"
                    required
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Type comments here..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-aws-gray-200 bg-white text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-aws-orange hover:bg-aws-orange-dark text-white shadow cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* PROGRESS HISTORY */}
            {activeTab === 'progress' && (
              <div className="space-y-2">
                {progressUpdates.map((update) => (
                  <div key={update.id} className="p-2 border-b border-aws-gray-50 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {update.percentage}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-aws-slate">{update.user?.name || 'Staff'}</span>
                        <span className="text-[9px] text-aws-gray-400">{formatDate(update.createdAt)}</span>
                      </div>
                      <p className="text-aws-gray-500 italic">
                        {update.comment || 'Progress log checkin.'}
                      </p>
                    </div>
                  </div>
                ))}
                {progressUpdates.length === 0 && (
                  <p className="text-aws-gray-400 text-center py-8">No progress histories logged.</p>
                )}
                {hasMoreProgress && (
                  <button
                    onClick={loadMoreProgress}
                    className="w-full py-1 text-center font-bold text-aws-orange hover:underline cursor-pointer"
                  >
                    Load More Logs
                  </button>
                )}
              </div>
            )}

            {/* AUDIT ACTIVITY LOG */}
            {activeTab === 'activity' && (
              <div className="space-y-2">
                {activityLogs.map((log) => {
                  const displayAction = log.action.replace('_', ' ').toUpperCase();
                  return (
                    <div key={log.id} className="p-2 border-b border-aws-gray-50 flex justify-between items-start gap-2">
                      <div>
                        <span className="font-semibold text-aws-slate mr-1.5">{log.user?.name || 'System'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          log.action === 'created'
                            ? 'bg-blue-100 text-blue-600'
                            : log.action === 'deleted'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-aws-gray-100 text-aws-gray-600'
                        }`}>
                          {displayAction}
                        </span>
                        {log.metadata?.newStatus && (
                          <span className="text-[10px] text-aws-gray-500 block mt-0.5">
                            Status change to <span className="font-semibold">{log.metadata.newStatus}</span>
                          </span>
                        )}
                        {log.metadata?.newProgress !== undefined && (
                          <span className="text-[10px] text-aws-gray-500 block mt-0.5">
                            Progress meter check: <span className="font-semibold">{log.metadata.newProgress}%</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-aws-gray-400 whitespace-nowrap">{formatDate(log.createdAt)}</span>
                    </div>
                  );
                })}
                {activityLogs.length === 0 && (
                  <p className="text-aws-gray-400 text-center py-8">No activity logs recorded.</p>
                )}
                {hasMoreActivity && (
                  <button
                    onClick={loadMoreActivity}
                    className="w-full py-1 text-center font-bold text-aws-orange hover:underline cursor-pointer"
                  >
                    Load More Timeline
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
