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
  Paperclip,
  Check,
  Download,
  Eye,
  FileText,
  Archive,
  ArrowRight,
  Lock,
  ThumbsUp,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/user-context';
import type { Task, Comment, Activity, TaskStatus, Priority, TaskCategory } from '@/lib/types';
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
  const [task, setTask] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLogs, setActivityLogs] = useState<Activity[]>([]);
  const [workUpdates, setWorkUpdates] = useState<any[]>([]);
  const [reviewDecisions, setReviewDecisions] = useState<any[]>([]);
  const [groupedFiles, setGroupedFiles] = useState<any>({
    images: [],
    documents: [],
    pdfs: [],
    archives: [],
    others: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab inside detailed workspace panel
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'updates' | 'discussion' | 'reviews' | 'files' | 'timeline'>('overview');

  // Input / Submission states
  const [newComment, setNewComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Work Proof Submission form
  const [workDescription, setWorkDescription] = useState('');
  const [workProgress, setWorkProgress] = useState(50);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Review Decision form
  const [reviewDecisionType, setReviewDecisionType] = useState<'approved' | 'changes_requested'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
      const [details, wUpdates, reviewsData, filesData] = await Promise.all([
        api.getTaskDetails(taskId),
        api.getWorkUpdates(taskId),
        api.getReviews(taskId),
        api.getFiles(taskId)
      ]);

      setTask(details.task);
      setComments(details.comments);
      setActivityLogs(details.activityLogs);
      setWorkUpdates(wUpdates);
      setReviewDecisions(reviewsData);
      setGroupedFiles(filesData);

      // Setup initial edit states
      setEditName(details.task.name);
      setEditNotes(details.task.notes || '');
      setEditPriority(details.task.priority);
      setEditCategory(details.task.category);
      setEditAssignedToId(details.task.assignedTo?.id || 'unassigned');
      setEditDueDate(details.task.dueDate ? new Date(details.task.dueDate).toISOString().split('T')[0] : '');
      setEditStartDate(details.task.startDate ? new Date(details.task.startDate).toISOString().split('T')[0] : '');
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

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateTaskStatus(taskId, newStatus);
      await fetchDetails();
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await api.addComment(taskId, newComment.trim());
      setComments(prev => [added, ...prev]);
      setNewComment('');
      // Reload timeline details
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
      await api.updateTask(taskId, {
        name: editName,
        notes: editNotes,
        priority: editPriority,
        category: editCategory,
        assignedToId: editAssignedToId === 'unassigned' ? null : editAssignedToId,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : null,
        dueDate: new Date(editDueDate).toISOString(),
      });
      setIsEditing(false);
      await fetchDetails();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Work updates files
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.rar'
    ];
    const maxBytes = 25 * 1024 * 1024; // 25 MB

    setIsUploading(true);
    setUploadError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const size = file.size;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (size > maxBytes) {
          setUploadError(`File ${file.name} exceeds the 25MB limit.`);
          continue;
        }

        if (!allowedExtensions.includes(ext)) {
          setUploadError(`Extension ${ext} not allowed.`);
          continue;
        }

        const res = await api.uploadFile(file, taskId);
        setUploadedAttachments(prev => [...prev, {
          fileName: res.fileName,
          fileUrl: res.fileUrl,
          fileType: res.fileType,
          fileSize: res.fileSize
        }]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setUploadedAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleWorkUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDescription.trim()) return;
    setIsSubmittingUpdate(true);
    try {
      await api.submitWorkUpdate(taskId, {
        description: workDescription,
        progress: workProgress,
        attachments: uploadedAttachments
      });
      setWorkDescription('');
      setUploadedAttachments([]);
      await fetchDetails();
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await api.submitReviewDecision(taskId, {
        decision: reviewDecisionType,
        comment: reviewComment
      });
      setReviewComment('');
      await fetchDetails();
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await api.deleteAttachment(attachmentId);
      await fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && !task) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 rounded-2xl border border-aws-gray-200 text-aws-slate font-medium shadow-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-aws-orange border-t-transparent animate-spin" />
          <span>Syncing workspace context...</span>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
  const isAssignedReviewer = task.reviewAssignedToId === currentUser?.id;
  const canReview = isCore && (!task.reviewAssignedToId || isAssignedReviewer);

  return (
    <div className="fixed inset-0 z-50 bg-aws-slate/40 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl border border-aws-gray-200 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header Panel */}
        <div className="px-6 py-4 border-b border-aws-gray-150 flex items-center justify-between flex-wrap gap-4 bg-aws-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full gradient-orange" />
            <div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
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
                <StatusBadge status={task.status} />
                {overdue && (
                  <span className="bg-red-50 text-red-600 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={11} /> Overdue
                  </span>
                )}
                {task.archivedAt && (
                  <span className="bg-aws-slate text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Archive size={11} /> Archived
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-aws-slate mt-1 flex items-center gap-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-base font-bold text-aws-slate border border-aws-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                  />
                ) : (
                  <span>{task.name}</span>
                )}
                {isCore && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded hover:bg-aws-gray-100 text-aws-gray-400 hover:text-aws-slate transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-aws-gray-100 flex items-center justify-center text-aws-gray-500 hover:text-aws-slate transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex border-b border-aws-gray-150 px-6 gap-6 bg-white overflow-x-auto">
          {(['overview', 'updates', 'discussion', 'reviews', 'files', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setWorkspaceTab(tab)}
              className={`py-3.5 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                workspaceTab === tab ? 'text-aws-orange' : 'text-aws-gray-500 hover:text-aws-slate'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'updates' && `Work Updates (${workUpdates.length})`}
              {tab === 'discussion' && `Discussion (${comments.length})`}
              {tab === 'reviews' && `Reviews (${reviewDecisions.length})`}
              {tab === 'files' && 'Files'}
              {tab === 'timeline' && 'Timeline'}
              {workspaceTab === tab && (
                <motion.div layoutId="workspace-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-aws-orange" />
              )}
            </button>
          ))}
        </div>

        {/* Workspace Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[350px]">
          {/* OVERVIEW TAB */}
          {workspaceTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-aws-gray-50/50 border border-aws-gray-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-aws-slate mb-2">Notes & Requirements</h4>
                  {isEditing ? (
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      rows={4}
                      className="w-full text-xs text-aws-slate border border-aws-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                    />
                  ) : (
                    <p className="text-xs text-aws-gray-600 leading-relaxed whitespace-pre-wrap">
                      {task.notes || 'No description or requirements logged.'}
                    </p>
                  )}
                </div>

                {/* Workflow lifecycle logs */}
                <div className="bg-white border border-aws-gray-150 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-aws-slate">Workflow Lifecycle Timestamps</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px]">
                    <div className="border border-aws-gray-50 bg-aws-gray-50/20 p-2 rounded-lg">
                      <span className="text-aws-gray-500 block">Created At</span>
                      <span className="font-semibold text-aws-slate">{formatDate(task.createdAt)}</span>
                    </div>
                    <div className="border border-aws-gray-50 bg-aws-gray-50/20 p-2 rounded-lg">
                      <span className="text-aws-gray-500 block">Assigned At</span>
                      <span className="font-semibold text-aws-slate">{task.assignedAt ? formatDate(task.assignedAt) : '—'}</span>
                    </div>
                    <div className="border border-aws-gray-50 bg-aws-gray-50/20 p-2 rounded-lg">
                      <span className="text-aws-gray-500 block">Submitted At</span>
                      <span className="font-semibold text-aws-slate">{task.submittedAt ? formatDate(task.submittedAt) : '—'}</span>
                    </div>
                    <div className="border border-aws-gray-50 bg-aws-gray-50/20 p-2 rounded-lg">
                      <span className="text-aws-gray-500 block">Reviewed At</span>
                      <span className="font-semibold text-aws-slate">{task.reviewedAt ? formatDate(task.reviewedAt) : '—'}</span>
                    </div>
                    <div className="border border-aws-gray-50 bg-aws-gray-50/20 p-2 rounded-lg">
                      <span className="text-aws-gray-500 block">Completed At</span>
                      <span className="font-semibold text-aws-slate">{task.completedAt ? formatDate(task.completedAt) : '—'}</span>
                    </div>
                    {task.archivedAt && (
                      <div className="border border-aws-gray-50 bg-aws-slate/5 p-2 rounded-lg">
                        <span className="text-aws-gray-500 block">Archived At</span>
                        <span className="font-semibold text-aws-slate">{formatDate(task.archivedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-aws-gray-200 text-aws-gray-500 hover:bg-aws-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-aws-orange text-white hover:bg-aws-orange-dark cursor-pointer"
                    >
                      Save Details
                    </button>
                  </div>
                )}
              </div>

              {/* Task Sidebar Overview Metadata */}
              <div className="space-y-4">
                <div className="bg-aws-gray-50/40 border border-aws-gray-150 rounded-xl p-4 space-y-3.5 text-xs">
                  <h4 className="text-xs font-bold text-aws-slate border-b border-aws-gray-150 pb-1.5">Task Metadata</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-aws-gray-500">Creator</span>
                    <span className="font-semibold text-aws-slate">{task.createdBy?.name || 'Core Team'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-aws-gray-500">Assignee</span>
                    {isEditing ? (
                      <select
                        value={editAssignedToId}
                        onChange={e => setEditAssignedToId(e.target.value)}
                        className="p-1 border border-aws-gray-200 bg-white rounded-lg text-xs"
                      >
                        <option value="unassigned">Unassigned</option>
                        {crewList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : task.assignedTo ? (
                      <span className="font-semibold text-aws-slate">{task.assignedTo.name}</span>
                    ) : (
                      <span className="italic text-aws-gray-400">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-aws-gray-500">Reviewer Assignment</span>
                    {isEditing ? (
                      <select
                        value={task.reviewAssignedToId || 'unassigned'}
                        onChange={e => {
                          const val = e.target.value;
                          setTask((prev: any) => ({ ...prev, reviewAssignedToId: val === 'unassigned' ? null : val }));
                        }}
                        className="p-1 border border-aws-gray-200 bg-white rounded-lg text-xs"
                      >
                        <option value="unassigned">Unassigned Reviewer</option>
                        {crewList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : task.reviewAssignedTo ? (
                      <span className="font-semibold text-aws-slate">{task.reviewAssignedTo.name}</span>
                    ) : (
                      <span className="italic text-aws-gray-400">Not Assigned</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-aws-gray-500">Priority Level</span>
                    {isEditing ? (
                      <select
                        value={editPriority}
                        onChange={e => setEditPriority(e.target.value as Priority)}
                        className="p-1 border border-aws-gray-200 bg-white rounded-lg text-xs"
                      >
                        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    ) : (
                      <PriorityBadge priority={task.priority} />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-aws-gray-500">Due Date</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={e => setEditDueDate(e.target.value)}
                        className="p-1 border border-aws-gray-200 bg-white rounded-lg text-xs"
                      />
                    ) : (
                      <span className={`font-semibold ${overdue ? 'text-red-500 font-bold' : 'text-aws-slate'}`}>{formatDate(task.dueDate)}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-aws-gray-500">Progress</span>
                    <span className="font-bold text-aws-orange">{task.progress}%</span>
                  </div>

                  {/* Quick Status Adjustments */}
                  <div className="border-t border-aws-gray-150 pt-3 flex flex-col gap-2">
                    <span className="font-bold text-aws-slate block">Modify Task Status</span>
                    <select
                      disabled={isUpdatingStatus}
                      value={task.status}
                      onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                      className="w-full border border-aws-gray-200 p-2 rounded-lg bg-white font-semibold focus:outline-none cursor-pointer"
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WORK UPDATES TAB */}
          {workspaceTab === 'updates' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submission cards list */}
              <div className="lg:col-span-2 space-y-4">
                {workUpdates.length > 0 ? (
                  workUpdates.map((update, idx) => (
                    <div key={update.id} className="border border-aws-gray-150 bg-white rounded-xl p-4 shadow-sm relative space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white">
                            {getInitials(update.user?.name || 'C')}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-aws-slate">{update.user?.name || 'Crew Member'}</span>
                            <span className="text-[10px] text-aws-gray-400 block">{formatDate(update.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-aws-orange/10 text-aws-orange px-2 py-0.5 rounded-full font-bold">Revision {update.revisionNumber}</span>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">{update.progress}% Complete</span>
                        </div>
                      </div>
                      <p className="text-xs text-aws-gray-700 leading-normal">{update.description}</p>
                      
                      {/* Attachments for this work update */}
                      {update.attachments && update.attachments.length > 0 && (
                        <div className="border-t border-aws-gray-50 pt-2.5 mt-2.5 space-y-1.5">
                          <span className="text-[10px] font-bold text-aws-gray-500 uppercase tracking-wider block">Attached Proofs:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {update.attachments.map((file: any) => (
                              <div key={file.id} className="flex items-center justify-between p-2 rounded-lg border border-aws-gray-100 bg-aws-gray-50/50 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Paperclip size={13} className="text-aws-gray-400 flex-shrink-0" />
                                  <span className="truncate text-aws-slate font-medium">{file.fileName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded hover:bg-aws-gray-200 text-aws-gray-500 hover:text-aws-slate cursor-pointer"
                                    title="View / Download"
                                  >
                                    <Download size={13} />
                                  </a>
                                  {(isCore || update.userId === currentUser?.id) && (
                                    <button
                                      onClick={() => handleDeleteAttachment(file.id)}
                                      className="p-1 rounded hover:bg-red-50 text-aws-gray-400 hover:text-red-650 cursor-pointer"
                                      title="Delete Attachment"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 border border-dashed border-aws-gray-250 rounded-xl bg-aws-gray-50/20">
                    <History size={32} className="text-aws-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-aws-gray-400">No work updates have been submitted yet.</p>
                  </div>
                )}
              </div>

              {/* Work proof submission form for crew / assigned members */}
              <div className="space-y-4">
                <div className="bg-aws-gray-50/40 border border-aws-gray-150 rounded-xl p-4 space-y-3.5">
                  <h4 className="text-xs font-bold text-aws-slate border-b border-aws-gray-150 pb-1.5 flex items-center gap-1.5">
                    <Plus size={14} className="text-aws-orange" />
                    Submit Work Update
                  </h4>

                  <form onSubmit={handleWorkUpdateSubmit} className="space-y-3.5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-aws-gray-600 block">Task Completion Progress</label>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-aws-slate">Progress Meter</span>
                        <span className="font-bold text-aws-orange">{workProgress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={workProgress}
                        onChange={e => setWorkProgress(Number(e.target.value))}
                        className="w-full accent-aws-orange h-1 rounded-lg bg-aws-gray-200 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-aws-gray-600 block">Revision Summary</label>
                      <textarea
                        required
                        value={workDescription}
                        onChange={e => setWorkDescription(e.target.value)}
                        rows={3}
                        placeholder="Detail the updates, accomplishments, or changes resolved..."
                        className="w-full border border-aws-gray-200 rounded-lg p-2 bg-white focus:outline-none"
                      />
                    </div>

                    {/* Files validation uploader */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-aws-gray-600 block">Attach Files (Max 25MB)</label>
                      <div className="flex items-center justify-center border-2 border-dashed border-aws-gray-200 rounded-xl p-3 bg-white hover:bg-aws-gray-50/50 transition-colors relative">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="text-center space-y-1">
                          <Paperclip size={16} className="text-aws-gray-400 mx-auto" />
                          <span className="text-[10px] font-medium text-aws-gray-500 block">Click or Drag attachments here</span>
                        </div>
                      </div>

                      {isUploading && (
                        <div className="text-[10px] font-semibold text-aws-orange animate-pulse flex items-center gap-1.5 justify-center py-1">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-aws-orange border-t-transparent animate-spin" />
                          Uploading proof files...
                        </div>
                      )}

                      {uploadError && (
                        <div className="text-[10px] font-semibold text-red-500 text-center bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1 justify-center">
                          <AlertCircle size={12} />
                          {uploadError}
                        </div>
                      )}

                      {/* Pending attachments array */}
                      {uploadedAttachments.length > 0 && (
                        <div className="space-y-1.5 border-t border-aws-gray-100 pt-2">
                          <span className="text-[9px] font-bold text-aws-gray-400 block uppercase">Selected Files:</span>
                          <div className="space-y-1">
                            {uploadedAttachments.map((att, idx) => (
                              <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg border border-aws-gray-100 bg-white text-[11px]">
                                <span className="truncate max-w-[150px] font-medium text-aws-slate">{att.fileName}</span>
                                <button
                                  type="button"
                                  onClick={() => removePendingAttachment(idx)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingUpdate || !workDescription.trim()}
                      className="w-full py-2 bg-aws-orange hover:bg-aws-orange-dark text-white font-bold rounded-lg transition-colors cursor-pointer disabled:bg-aws-gray-200 disabled:text-aws-gray-400"
                    >
                      {isSubmittingUpdate ? 'Submitting...' : 'Submit Update'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* DISCUSSION TAB */}
          {workspaceTab === 'discussion' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-xl border border-aws-gray-150 bg-aws-gray-50/40 group relative flex gap-3">
                    <div className="w-7 h-7 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {getInitials(comment.user?.name || comment.userName || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-aws-slate">{comment.user?.name || comment.userName || 'User'}</span>
                        <span className="text-[10px] text-aws-gray-400">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-aws-gray-750 leading-relaxed pr-6">{comment.message}</p>
                      
                      {(isCore || comment.userId === currentUser?.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="absolute right-3 top-3 text-aws-gray-300 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-aws-gray-400 text-center py-12">No comments have been posted to this task thread.</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 border-t border-aws-gray-150 pt-3">
                <input
                  type="text"
                  required
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Post comments to the collaboration thread..."
                  className="flex-1 px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-aws-slate hover:bg-aws-slate-light text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                >
                  Post Comment
                </button>
              </form>
            </div>
          )}

          {/* REVIEWS TAB */}
          {workspaceTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reviews history list */}
              <div className="lg:col-span-2 space-y-4">
                {reviewDecisions.length > 0 ? (
                  reviewDecisions.map((decision) => (
                    <div key={decision.id} className="border border-aws-gray-150 bg-white rounded-xl p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white">
                            {getInitials(decision.reviewer?.name || 'R')}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-aws-slate">{decision.reviewer?.name || 'Reviewer'}</span>
                            <span className="text-[10px] text-aws-gray-400 block">{formatDate(decision.createdAt)}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          decision.decision === 'approved' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-red-50 text-red-650 border border-red-200'
                        }`}>
                          {decision.decision === 'approved' ? 'Approved' : 'Changes Requested'}
                        </span>
                      </div>
                      <p className="text-xs text-aws-gray-700 leading-normal italic">"{decision.comment}"</p>
                      {decision.workUpdate && (
                        <div className="text-[10px] bg-aws-gray-50 p-2 rounded-lg text-aws-gray-550 border border-aws-gray-100 mt-1">
                          <span className="font-semibold block text-aws-slate">Revision Reviewed: Revision {decision.workUpdate.revisionNumber}</span>
                          <span className="truncate block mt-0.5">{decision.workUpdate.description}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 border border-dashed border-aws-gray-250 rounded-xl bg-aws-gray-50/20">
                    <Shield size={32} className="text-aws-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-aws-gray-400">No review decisions have been logged yet.</p>
                  </div>
                )}
              </div>

              {/* Review decisions submission form for authorized Core users */}
              <div className="space-y-4">
                {canReview ? (
                  <div className="bg-aws-gray-50/40 border border-aws-gray-150 rounded-xl p-4 space-y-3.5">
                    <h4 className="text-xs font-bold text-aws-slate border-b border-aws-gray-150 pb-1.5 flex items-center gap-1.5">
                      <Shield size={14} className="text-aws-orange" />
                      Submit Review Decision
                    </h4>

                    <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-aws-gray-600 block">Decision Type</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setReviewDecisionType('approved')}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                              reviewDecisionType === 'approved' 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 font-bold' 
                                : 'bg-white border-aws-gray-200 text-aws-gray-500'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewDecisionType('changes_requested')}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                              reviewDecisionType === 'changes_requested' 
                                ? 'bg-red-50 border-red-300 text-red-650 font-bold' 
                                : 'bg-white border-aws-gray-200 text-aws-gray-500'
                            }`}
                          >
                            Request Changes
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-aws-gray-600 block">Review Feedback / Comment</label>
                        <textarea
                          required
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          rows={4}
                          placeholder="Provide specific details or feedback regarding the work proof materials..."
                          className="w-full border border-aws-gray-200 rounded-lg p-2 bg-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReview || !reviewComment.trim()}
                        className="w-full py-2 bg-aws-slate hover:bg-aws-slate-light text-white font-bold rounded-lg transition-colors cursor-pointer disabled:bg-aws-gray-200 disabled:text-aws-gray-400"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Log Decision'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-center text-xs space-y-2 text-red-600">
                    <Lock size={20} className="mx-auto text-red-400" />
                    <p className="font-semibold">Review Action Disabled</p>
                    <p className="text-[10px] leading-normal text-red-550">
                      {isCore 
                        ? 'You are not the designated reviewer for this task.' 
                        : 'Only Core administrators can log review decisions.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FILES TAB */}
          {workspaceTab === 'files' && (
            <div className="space-y-5 text-xs">
              {Object.keys(groupedFiles).some(key => groupedFiles[key].length > 0) ? (
                <div className="space-y-5">
                  {(Object.keys(groupedFiles) as Array<keyof typeof groupedFiles>).map(categoryKey => {
                    const filesList = groupedFiles[categoryKey];
                    if (filesList.length === 0) return null;

                    const titleLabels = {
                      images: 'Images & Photos',
                      documents: 'Office Documents',
                      pdfs: 'PDF Documentations',
                      archives: 'Compilations & Archives',
                      others: 'Other Attachments'
                    };

                    return (
                      <div key={categoryKey as string} className="space-y-2 border-b border-aws-gray-50 pb-4 last:border-0">
                        <h4 className="text-xs font-bold text-aws-slate capitalize flex items-center gap-1.5">
                          {categoryKey === 'images' && <ImageIcon size={14} className="text-aws-orange" />}
                          {categoryKey === 'documents' && <FileSpreadsheet size={14} className="text-aws-orange" />}
                          {categoryKey === 'pdfs' && <FileText size={14} className="text-aws-orange" />}
                          {categoryKey === 'archives' && <Archive size={14} className="text-aws-orange" />}
                          {categoryKey === 'others' && <Paperclip size={14} className="text-aws-orange" />}
                          {(titleLabels as any)[categoryKey]} ({filesList.length})
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {filesList.map((file: any) => {
                            const sizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);
                            return (
                              <div key={file.id} className="border border-aws-gray-150 rounded-xl p-3 bg-white flex items-center justify-between gap-3 shadow-sm hover:shadow transition-shadow">
                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-aws-gray-50 flex items-center justify-center text-aws-gray-400 flex-shrink-0">
                                    <FileCode size={16} />
                                  </div>
                                  <div className="min-w-0 leading-tight">
                                    <span className="truncate block text-xs font-semibold text-aws-slate" title={file.fileName}>{file.fileName}</span>
                                    <span className="text-[10px] text-aws-gray-400 block mt-0.5">{sizeMB} MB</span>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded hover:bg-aws-gray-100 text-aws-gray-500 hover:text-aws-slate cursor-pointer"
                                    title="View / Download"
                                  >
                                    <Download size={13} />
                                  </a>
                                  {(isCore || file.workUpdate?.userId === currentUser?.id) && (
                                    <button
                                      onClick={() => handleDeleteAttachment(file.id)}
                                      className="p-1 rounded hover:bg-red-50 text-aws-gray-400 hover:text-red-650 cursor-pointer"
                                      title="Delete Attachment"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-aws-gray-250 rounded-xl bg-aws-gray-50/20">
                  <Paperclip size={36} className="text-aws-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-aws-gray-400">No attachments found for this task workspace.</p>
                </div>
              )}
            </div>
          )}

          {/* TIMELINE TAB */}
          {workspaceTab === 'timeline' && (
            <div className="relative border-l border-aws-gray-150 pl-5 ml-3.5 space-y-5 text-xs py-2">
              {activityLogs.map((log) => {
                let badgeColor = 'bg-aws-gray-100 text-aws-gray-600';
                let icon = <ActivityIcon size={12} />;

                if (log.action === 'created') {
                  badgeColor = 'bg-blue-50 text-blue-600 border border-blue-200';
                  icon = <FileText size={12} />;
                } else if (log.action === 'assigned' || log.action === 'reassigned') {
                  badgeColor = 'bg-purple-50 text-purple-600 border border-purple-200';
                  icon = <User size={12} />;
                } else if (log.action === 'work_submitted') {
                  badgeColor = 'bg-orange-50 text-aws-orange border border-aws-orange-light/20';
                  icon = <ArrowRight size={12} />;
                } else if (log.action === 'review_approved') {
                  badgeColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                  icon = <CheckCircle2 size={12} />;
                } else if (log.action === 'review_changes_requested') {
                  badgeColor = 'bg-red-50 text-red-650 border border-red-200';
                  icon = <AlertTriangle size={12} />;
                } else if (log.action === 'comment_added') {
                  badgeColor = 'bg-teal-50 text-teal-600 border border-teal-200';
                  icon = <MessageSquare size={12} />;
                } else if (log.action === 'archived') {
                  badgeColor = 'bg-aws-slate text-white';
                  icon = <Archive size={12} />;
                }

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline circle icon indicator */}
                    <div className="absolute left-[-26px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-aws-orange flex items-center justify-center shadow-sm" />
                    
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-aws-slate">{log.user?.name || 'System Operator'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 uppercase ${badgeColor}`}>
                          {icon}
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-aws-gray-400">{formatDate(log.createdAt)}</span>
                      </div>
                      
                      {log.metadata && (
                        <div className="text-[11px] text-aws-gray-550 pl-1">
                          {log.metadata.comment && (
                            <span className="italic block mt-0.5">"{log.metadata.comment}"</span>
                          )}
                          {log.metadata.newStatus && (
                            <span>Transitioned task status to <span className="font-bold text-aws-slate">{log.metadata.newStatus}</span></span>
                          )}
                          {log.metadata.newProgress !== undefined && (
                            <span>Set progress to <span className="font-bold text-aws-orange">{log.metadata.newProgress}%</span></span>
                          )}
                          {log.metadata.newAssigneeId && (
                            <span>Assigned work to assignee ID: {log.metadata.newAssigneeId}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {activityLogs.length === 0 && (
                <div className="text-center py-12 text-aws-gray-400">
                  No activity logs logged to the audit timeline.
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
