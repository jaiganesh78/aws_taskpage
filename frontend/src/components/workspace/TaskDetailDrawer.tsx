'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  User,
  Shield,
  MessageSquare,
  History,
  Trash2,
  Plus,
  CheckCircle2,
  Edit2,
  Tag,
  AlertTriangle,
  Paperclip,
  Check,
  Download,
  FileText,
  Archive,
  Lock,
  ThumbsUp,
  FileCode,
  Image as ImageIcon,
  AlertCircle,
  FileUp,
  Search,
  ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/user-context';
import type { Task, Comment, Activity, TaskStatus, Priority, TaskCategory } from '@/lib/types';
import { CATEGORIES, PRIORITIES, STATUSES } from '@/lib/types';
import { formatDate, getInitials, isOverdue } from '@/lib/utils';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailDrawer({ taskId, onClose, onUpdate }: TaskDetailDrawerProps) {
  const { currentUser, users } = useUser();
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

  // Active Tab inside detailed drawer
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'updates' | 'discussion' | 'reviews' | 'files' | 'timeline'>('overview');

  // Input states
  const [newComment, setNewComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Work Submission states
  const [workDescription, setWorkDescription] = useState('');
  const [workProgress, setWorkProgress] = useState(50);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Review states
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

  // Files search and filter states
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [selectedFileGroup, setSelectedFileGroup] = useState<string>('all');

  const isCore = currentUser?.role === 'core';

  const fetchDetails = async () => {
    if (!taskId) return;
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
    if (taskId) {
      fetchDetails();
      if (isCore) {
        api.getCrew().then(res => setCrewList(res.data)).catch(console.error);
      }
    }
  }, [taskId]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!taskId) return;
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
    if (!taskId || !newComment.trim()) return;
    try {
      const added = await api.addComment(taskId, newComment.trim());
      setComments(prev => [added, ...prev]);
      setNewComment('');
      
      // Reload timeline and details
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
      if (taskId) {
        const details = await api.getTaskDetails(taskId);
        setActivityLogs(details.activityLogs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !task) return;
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

  // Upload work update files
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!taskId) return;
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
    if (!taskId || !workDescription.trim()) return;
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
    if (!taskId || !reviewComment.trim()) return;
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

  // 1. Unified Chronological Timeline
  // Merge work updates, review decisions, status changes, assignments, comments, uploads
  const unifiedTimeline = useMemo(() => {
    if (!task) return [];
    const events: { id: string; type: string; date: Date; user: any; title: string; meta: any }[] = [];

    // Comments
    comments.forEach(c => {
      events.push({
        id: `c-${c.id}`,
        type: 'comment',
        date: new Date(c.createdAt),
        user: c.user,
        title: 'posted a comment',
        meta: { text: c.message }
      });
    });

    // Work Updates
    workUpdates.forEach(w => {
      events.push({
        id: `w-${w.id}`,
        type: 'work_update',
        date: new Date(w.createdAt),
        user: w.user,
        title: `submitted Revision #${w.revisionNumber}`,
        meta: { description: w.description, progress: w.progress, attachments: w.attachments }
      });
    });

    // Reviews
    reviewDecisions.forEach(r => {
      events.push({
        id: `r-${r.id}`,
        type: 'review_decision',
        date: new Date(r.createdAt),
        user: r.reviewer,
        title: r.decision === 'approved' ? 'approved the task' : 'requested changes',
        meta: { decision: r.decision, comment: r.comment }
      });
    });

    // Activity log items (representing Status Changes, Assignments, Creation)
    activityLogs.forEach(log => {
      // Avoid duplicating comments or submissions already merged
      if (log.action === 'comment_added' || log.action === 'work_submitted' || log.action === 'review_approved' || log.action === 'review_changes_requested') {
        return;
      }
      
      let title = log.action.replace('_', ' ');
      if (log.action === 'created') title = 'created the task';
      else if (log.action === 'assigned') title = `assigned this task to ${log.metadata?.assigneeName || 'crew'}`;
      else if (log.action === 'reassigned') title = `reassigned task to ${log.metadata?.assigneeName || 'crew'}`;
      else if (log.action === 'status_updated') title = `changed status to "${(log.metadata?.newStatus || 'unknown').replace('_', ' ')}"`;
      else if (log.action === 'archived') title = 'archived the task';

      events.push({
        id: `act-${log.id}`,
        type: 'activity',
        date: new Date(log.createdAt),
        user: log.user,
        title: title,
        meta: log.metadata
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [task, comments, workUpdates, reviewDecisions, activityLogs]);

  // Group files filter logic
  const filteredFileList = useMemo(() => {
    let list: any[] = [];
    if (selectedFileGroup === 'all' || selectedFileGroup === 'images') {
      list = [...list, ...groupedFiles.images.map((f: any) => ({ ...f, group: 'Image' }))];
    }
    if (selectedFileGroup === 'all' || selectedFileGroup === 'pdfs') {
      list = [...list, ...groupedFiles.pdfs.map((f: any) => ({ ...f, group: 'PDF' }))];
    }
    if (selectedFileGroup === 'all' || selectedFileGroup === 'documents') {
      list = [...list, ...groupedFiles.documents.map((f: any) => ({ ...f, group: 'Document' }))];
    }
    if (selectedFileGroup === 'all' || selectedFileGroup === 'archives') {
      list = [...list, ...groupedFiles.archives.map((f: any) => ({ ...f, group: 'Archive' }))];
    }
    if (selectedFileGroup === 'all' || selectedFileGroup === 'others') {
      list = [...list, ...groupedFiles.others.map((f: any) => ({ ...f, group: 'Other' }))];
    }

    if (fileSearchQuery) {
      list = list.filter(f => f.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase()));
    }
    return list;
  }, [groupedFiles, selectedFileGroup, fileSearchQuery]);

  if (!taskId) return null;

  const overdue = task ? (isOverdue(task.dueDate) && task.status !== 'completed') : false;
  const isAssignedReviewer = task?.reviewAssignedToId === currentUser?.id;
  const canReview = isCore && (!task?.reviewAssignedToId || isAssignedReviewer);

  // Function to render file attachment previews visually
  const renderAttachmentPreview = (file: any) => {
    const isImage = file.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.fileName);
    const isPDF = file.fileType === 'application/pdf' || /\.pdf$/i.test(file.fileName);
    const isArchive = /\.(zip|rar|tar|gz)$/i.test(file.fileName);

    if (isImage) {
      return (
        <div key={file.id || file.fileUrl} className="border border-aws-gray-200 rounded-xl overflow-hidden bg-aws-gray-50 flex flex-col group relative shadow-sm">
          <div className="h-28 w-full overflow-hidden flex items-center justify-center bg-aws-gray-100">
            <img src={file.fileUrl} alt={file.fileName} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
          </div>
          <div className="p-2.5 flex items-center justify-between text-xs min-w-0 bg-white">
            <span className="truncate font-semibold text-aws-slate flex-1 mr-2">{file.fileName}</span>
            <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-aws-gray-100 text-aws-gray-500 hover:text-aws-orange">
              <Download size={13} />
            </a>
          </div>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div key={file.id || file.fileUrl} className="border border-aws-gray-200 rounded-xl p-3.5 bg-white flex items-center justify-between gap-3 shadow-sm hover:border-aws-gray-300 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-red-50 text-red-500 flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="truncate block font-semibold text-aws-slate text-xs">{file.fileName}</span>
              <span className="text-[10px] text-aws-gray-400">PDF Document</span>
            </div>
          </div>
          <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-aws-gray-100 text-aws-gray-500 hover:text-aws-orange flex-shrink-0">
            <Download size={13} />
          </a>
        </div>
      );
    }

    if (isArchive) {
      return (
        <div key={file.id || file.fileUrl} className="border border-aws-gray-200 rounded-xl p-3.5 bg-white flex items-center justify-between gap-3 shadow-sm hover:border-aws-gray-300 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
              <Archive size={18} />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="truncate block font-semibold text-aws-slate text-xs">{file.fileName}</span>
              <span className="text-[10px] text-aws-gray-400">Compressed Archive</span>
            </div>
          </div>
          <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-aws-gray-100 text-aws-gray-500 hover:text-aws-orange flex-shrink-0">
            <Download size={13} />
          </a>
        </div>
      );
    }

    return (
      <div key={file.id || file.fileUrl} className="border border-aws-gray-200 rounded-xl p-3.5 bg-white flex items-center justify-between gap-3 shadow-sm hover:border-aws-gray-300 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-aws-slate/5 text-aws-slate flex-shrink-0">
            <Paperclip size={18} />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="truncate block font-semibold text-aws-slate text-xs">{file.fileName}</span>
            <span className="text-[10px] text-aws-gray-400">File Attachment</span>
          </div>
        </div>
        <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-aws-gray-100 text-aws-gray-500 hover:text-aws-orange flex-shrink-0">
          <Download size={13} />
        </a>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop (Click to close) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-aws-slate/20 backdrop-blur-[3px]"
        />

        {/* Drawer Panel: Responsive width widths (80-85% desktop, 95-100% tablet, full-screen mobile) */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative h-full bg-white border-l border-aws-gray-200 drawer-container shadow-2xl flex flex-col z-10 w-full sm:w-[95%] md:w-[95%] lg:w-[82%] xl:w-[85%]"
        >
          {isLoading && !task ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-aws-orange border-t-transparent animate-spin" />
              <span className="text-xs text-aws-gray-500 font-semibold">Opening Task Workspace...</span>
            </div>
          ) : !task ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="text-red-500 mb-2" />
              <p className="font-semibold text-aws-slate text-sm">Failed to retrieve task workspace context.</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-aws-slate text-white text-xs font-semibold rounded-lg">
                Close Panel
              </button>
            </div>
          ) : (
            <>
              {/* Drawer Workspace Header */}
              <div className="px-6 py-4.5 border-b border-aws-gray-150 flex items-center justify-between flex-wrap gap-4 bg-aws-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full gradient-orange flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span
                        className="font-bold px-2 py-0.5 rounded-full uppercase text-[9px]"
                        style={{
                          background: `${CATEGORIES.find(c => c.value === task.category)?.color}10`,
                          color: CATEGORIES.find(c => c.value === task.category)?.color,
                          border: `1px solid ${CATEGORIES.find(c => c.value === task.category)?.color}15`
                        }}
                      >
                        {CATEGORIES.find(c => c.value === task.category)?.label}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      {overdue && (
                        <span className="bg-red-50 text-red-650 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase border border-red-100 flex items-center gap-0.5">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-aws-slate mt-1 flex items-center gap-2 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="text-sm font-bold text-aws-slate border border-aws-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aws-orange/20 max-w-md"
                        />
                      ) : (
                        <span className="truncate">{task.name}</span>
                      )}
                      {isCore && !isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 rounded hover:bg-aws-gray-100 text-aws-gray-400 hover:text-aws-slate transition-colors cursor-pointer flex-shrink-0"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-aws-gray-400 font-bold mr-2 hidden md:inline">TASK WORKSPACE</span>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-aws-gray-150 flex items-center justify-center text-aws-gray-500 hover:text-aws-slate transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Workspace Navigation Tabs (Within Drawer Workspace Context) */}
              <div className="flex border-b border-aws-gray-150 px-6 gap-6 bg-white overflow-x-auto select-none">
                {(['overview', 'updates', 'discussion', 'reviews', 'files', 'timeline'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setWorkspaceTab(tab)}
                    className={`py-3.5 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                      workspaceTab === tab ? 'text-aws-orange' : 'text-aws-gray-500 hover:text-aws-slate'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'updates' && `Work Evidence (${workUpdates.length})`}
                    {tab === 'discussion' && `Collaborators Thread (${comments.length})`}
                    {tab === 'reviews' && `Review History (${reviewDecisions.length})`}
                    {tab === 'files' && 'Asset Repository'}
                    {tab === 'timeline' && 'Audit Story'}
                    {workspaceTab === tab && (
                      <motion.div layoutId="drawer-workspace-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-aws-orange" />
                    )}
                  </button>
                ))}
              </div>

              {/* Main Workspace split panel (Left 2/3 Content, Right 1/3 Metadata) */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Left 2/3 Workspace Viewport */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 workspace-scrollable">
                  {/* OVERVIEW TAB */}
                  {workspaceTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="bg-aws-gray-50/50 border border-aws-gray-150 rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-aws-slate uppercase tracking-wider">Notes & Guidelines</h3>
                        {isEditing ? (
                          <textarea
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            rows={6}
                            className="w-full text-xs text-aws-slate border border-aws-gray-250 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                            placeholder="Add task instructions, guidelines or notes..."
                          />
                        ) : (
                          <p className="text-xs text-aws-gray-600 leading-relaxed whitespace-pre-wrap">
                            {task.notes || 'No notes or specific guidelines have been recorded for this operational task.'}
                          </p>
                        )}
                      </div>

                      {/* Timeline status milestones */}
                      <div className="border border-aws-gray-200 rounded-xl p-5 bg-white space-y-4">
                        <h3 className="text-xs font-bold text-aws-slate uppercase tracking-wider">Workflow Lifecycle Milestamps</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
                          <div className="border border-aws-gray-100 bg-aws-gray-50/30 p-2.5 rounded-lg">
                            <span className="text-aws-gray-400 block font-medium">Created On</span>
                            <span className="font-semibold text-aws-slate">{formatDate(task.createdAt)}</span>
                          </div>
                          <div className="border border-aws-gray-100 bg-aws-gray-50/30 p-2.5 rounded-lg">
                            <span className="text-aws-gray-400 block font-medium">Assigned On</span>
                            <span className="font-semibold text-aws-slate">{task.assignedAt ? formatDate(task.assignedAt) : '—'}</span>
                          </div>
                          <div className="border border-aws-gray-100 bg-aws-gray-50/30 p-2.5 rounded-lg">
                            <span className="text-aws-gray-400 block font-medium">First Submission</span>
                            <span className="font-semibold text-aws-slate">{task.submittedAt ? formatDate(task.submittedAt) : '—'}</span>
                          </div>
                          <div className="border border-aws-gray-100 bg-aws-gray-50/30 p-2.5 rounded-lg">
                            <span className="text-aws-gray-400 block font-medium">Last Reviewed</span>
                            <span className="font-semibold text-aws-slate">{task.reviewedAt ? formatDate(task.reviewedAt) : '—'}</span>
                          </div>
                          <div className="border border-aws-gray-100 bg-aws-gray-50/30 p-2.5 rounded-lg">
                            <span className="text-aws-gray-400 block font-medium">Marked Complete</span>
                            <span className="font-semibold text-aws-slate">{task.completedAt ? formatDate(task.completedAt) : '—'}</span>
                          </div>
                          {task.archivedAt && (
                            <div className="border border-aws-gray-150 bg-aws-slate/5 p-2.5 rounded-lg">
                              <span className="text-aws-gray-400 block font-medium">Archived On</span>
                              <span className="font-semibold text-aws-slate">{formatDate(task.archivedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-2 justify-end">
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
                  )}

                  {/* WORK UPDATES (EVIDENCE) TAB */}
                  {workspaceTab === 'updates' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2 space-y-4">
                        {workUpdates.length > 0 ? (
                          workUpdates.map((update, idx) => (
                            <div key={update.id} className="border border-aws-gray-150 bg-white rounded-xl p-4.5 shadow-sm space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                    {getInitials(update.user?.name || 'C')}
                                  </div>
                                  <div>
                                    <span className="font-bold text-aws-slate block leading-tight">{update.user?.name || 'Crew Member'}</span>
                                    <span className="text-[10px] text-aws-gray-400 block mt-0.5">{formatDate(update.createdAt)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-aws-orange/10 text-aws-orange border border-aws-orange-light/20 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                    Revision #{update.revisionNumber}
                                  </span>
                                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                    {update.progress}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-aws-gray-700 leading-relaxed whitespace-pre-wrap">
                                {update.description}
                              </p>

                              {/* Attachment visual grid cards */}
                              {update.attachments && update.attachments.length > 0 && (
                                <div className="border-t border-aws-gray-100 pt-3 mt-3 space-y-2">
                                  <span className="text-[9px] font-bold text-aws-gray-400 uppercase tracking-wider block">Evidence Attachments ({update.attachments.length})</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {update.attachments.map((file: any) => renderAttachmentPreview(file))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-16 border border-dashed border-aws-gray-250 rounded-xl bg-aws-gray-50/20">
                            <History size={28} className="text-aws-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-aws-gray-400">No work updates or deliverables submitted yet.</p>
                          </div>
                        )}
                      </div>

                      {/* Crew Member Submission panel */}
                      <div className="space-y-4">
                        <div className="bg-aws-gray-50/40 border border-aws-gray-150 rounded-xl p-4.5 space-y-4">
                          <h4 className="text-xs font-bold text-aws-slate border-b border-aws-gray-150 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <FileUp size={14} className="text-aws-orange" />
                            Submit Deliverable
                          </h4>

                          <form onSubmit={handleWorkUpdateSubmit} className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                <span className="text-aws-gray-650">Progress Meter</span>
                                <span className="text-aws-orange font-bold">{workProgress}%</span>
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
                              <label className="text-[10px] font-bold text-aws-gray-650 uppercase">Update Details</label>
                              <textarea
                                required
                                value={workDescription}
                                onChange={e => setWorkDescription(e.target.value)}
                                rows={4}
                                placeholder="Detail accomplishments, changes made, and items resolved..."
                                className="w-full border border-aws-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-aws-orange/15 transition-all text-xs"
                              />
                            </div>

                            {/* Evidence files uploader */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-aws-gray-650 uppercase">Upload Assets</label>
                              <div className="flex items-center justify-center border-2 border-dashed border-aws-gray-200 rounded-xl p-4 bg-white hover:bg-aws-gray-50/50 transition-colors relative">
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleFileChange}
                                  disabled={isUploading}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="text-center space-y-1.5">
                                  <Paperclip size={16} className="text-aws-gray-400 mx-auto" />
                                  <span className="text-[10px] font-medium text-aws-gray-500 block">Click/Drag files (Max 25MB)</span>
                                </div>
                              </div>

                              {isUploading && (
                                <div className="text-[10px] font-semibold text-aws-orange animate-pulse flex items-center gap-1.5 justify-center py-1">
                                  <div className="w-3 h-3 rounded-full border border-aws-orange border-t-transparent animate-spin" />
                                  Uploading assets...
                                </div>
                              )}

                              {uploadError && (
                                <div className="text-[10px] font-semibold text-red-500 text-center bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1 justify-center">
                                  <AlertCircle size={12} />
                                  {uploadError}
                                </div>
                              )}

                              {uploadedAttachments.length > 0 && (
                                <div className="space-y-1.5 border-t border-aws-gray-100 pt-2.5">
                                  <span className="text-[9px] font-bold text-aws-gray-400 uppercase tracking-wider block">Attached files:</span>
                                  <div className="space-y-1">
                                    {uploadedAttachments.map((att, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg border border-aws-gray-150 bg-white text-[11px]">
                                        <span className="truncate max-w-[150px] font-medium text-aws-slate">{att.fileName}</span>
                                        <button
                                          type="button"
                                          onClick={() => removePendingAttachment(idx)}
                                          className="text-red-500 hover:text-red-750 cursor-pointer p-0.5 hover:bg-red-50 rounded"
                                        >
                                          <X size={11} />
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
                              className="w-full py-2 bg-aws-orange hover:bg-aws-orange-dark text-white font-bold rounded-lg transition-colors cursor-pointer disabled:bg-aws-gray-250 disabled:text-aws-gray-450 text-xs shadow-md shadow-aws-orange/15 hover:shadow-lg"
                            >
                              {isSubmittingUpdate ? 'Submitting updates...' : 'Submit Work Update'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DISCUSSION TAB (COLLABORATIVE THREAD) */}
                  {workspaceTab === 'discussion' && (
                    <div className="space-y-5">
                      <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1 workspace-scrollable">
                        {comments.map((comment) => (
                          <div key={comment.id} className="p-3.5 rounded-xl border border-aws-gray-150 bg-aws-gray-50/30 group relative flex gap-3.5 items-start">
                            <div className="w-8 h-8 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                              {getInitials(comment.user?.name || comment.userName || 'U')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1 flex-wrap gap-2 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-aws-slate">{comment.user?.name || comment.userName || 'Operator'}</span>
                                  {(() => {
                                    const userRole = users.find(u => u.id === comment.userId)?.role;
                                    return userRole ? (
                                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                                        userRole === 'core' ? 'bg-aws-orange/10 text-aws-orange' : 'bg-aws-slate/10 text-aws-slate'
                                      }`}>
                                        {userRole}
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                <span className="text-[10px] text-aws-gray-400">{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-xs text-aws-gray-700 leading-relaxed pr-6">{comment.message}</p>
                              
                              {(isCore || comment.userId === currentUser?.id) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="absolute right-3.5 top-3.5 text-aws-gray-400 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded hover:bg-aws-gray-100"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <div className="text-center py-16 text-aws-gray-400">
                            <MessageSquare size={28} className="text-aws-gray-300 mx-auto mb-2" />
                            <p className="text-xs">No active discussions on this task thread.</p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleAddComment} className="flex gap-2 border-t border-aws-gray-150 pt-4">
                        <input
                          type="text"
                          required
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder="Send a message to team members..."
                          className="flex-1 px-3.5 py-2 border border-aws-gray-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/15 transition-all"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-aws-slate hover:bg-aws-slate-light text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  )}

                  {/* REVIEWS TAB */}
                  {workspaceTab === 'reviews' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2 space-y-4">
                        {reviewDecisions.length > 0 ? (
                          reviewDecisions.map((review, idx) => {
                            const isApproved = review.decision === 'approved';
                            return (
                              <div 
                                key={review.id} 
                                className={`border rounded-xl p-4.5 shadow-sm space-y-2.5 ${
                                  isApproved 
                                    ? 'bg-emerald-50/20 border-emerald-200/50' 
                                    : 'bg-red-50/20 border-red-200/50'
                                }`}
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                      {getInitials(review.reviewer?.name || 'R')}
                                    </div>
                                    <div>
                                      <span className="font-bold text-aws-slate block leading-tight">{review.reviewer?.name || 'Reviewer'}</span>
                                      <span className="text-[10px] text-aws-gray-400 block mt-0.5">{formatDate(review.createdAt)}</span>
                                    </div>
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                                    isApproved 
                                      ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' 
                                      : 'bg-red-100/50 text-red-700 border-red-200'
                                  }`}>
                                    {review.decision === 'approved' ? 'Approved' : 'Changes Requested'}
                                  </span>
                                </div>
                                <p className="text-xs text-aws-gray-700 leading-relaxed font-medium">
                                  {review.comment}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-16 border border-dashed border-aws-gray-250 rounded-xl bg-aws-gray-50/20">
                            <CheckCircle2 size={28} className="text-aws-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-aws-gray-400">No review logs available for this task.</p>
                          </div>
                        )}
                      </div>

                      {/* Core Admin Reviews controls */}
                      {canReview && (
                        <div className="space-y-4">
                          <div className="bg-aws-gray-50/40 border border-aws-gray-150 rounded-xl p-4.5 space-y-4">
                            <h4 className="text-xs font-bold text-aws-slate border-b border-aws-gray-150 pb-2 uppercase tracking-wider">
                              Register Review Decision
                            </h4>

                            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-aws-gray-650 uppercase">Decision</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setReviewDecisionType('approved')}
                                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                                      reviewDecisionType === 'approved'
                                        ? 'bg-emerald-50 border-emerald-450 text-emerald-700 shadow-sm'
                                        : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300'
                                    }`}
                                  >
                                    Approve Task
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReviewDecisionType('changes_requested')}
                                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                                      reviewDecisionType === 'changes_requested'
                                        ? 'bg-red-50 border-red-400 text-red-700 shadow-sm'
                                        : 'bg-white border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300'
                                    }`}
                                  >
                                    Request Changes
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-aws-gray-655 uppercase">Review Feedback</label>
                                <textarea
                                  required
                                  value={reviewComment}
                                  onChange={e => setReviewComment(e.target.value)}
                                  rows={4}
                                  placeholder="Detail comments, review reasons, or requested revisions..."
                                  className="w-full border border-aws-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-aws-orange/15 transition-all text-xs"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isSubmittingReview || !reviewComment.trim()}
                                className={`w-full py-2 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs disabled:bg-aws-gray-250 disabled:text-aws-gray-450 ${
                                  reviewDecisionType === 'approved' 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                                    : 'bg-red-650 hover:bg-red-700 shadow-red-650/10'
                                }`}
                              >
                                {isSubmittingReview ? 'Registering decision...' : 'Submit Review'}
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FILES TAB */}
                  {workspaceTab === 'files' && (
                    <div className="space-y-4">
                      {/* Filtering and Search Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-aws-gray-150 pb-3">
                        <div className="relative w-full sm:max-w-xs">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aws-gray-450" />
                          <input
                            type="text"
                            value={fileSearchQuery}
                            onChange={e => setFileSearchQuery(e.target.value)}
                            placeholder="Search assets..."
                            className="w-full pl-8 pr-3 py-1.5 border border-aws-gray-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/15"
                          />
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto select-none">
                          {['all', 'images', 'pdfs', 'documents', 'archives'].map(group => (
                            <button
                              key={group}
                              onClick={() => setSelectedFileGroup(group)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                selectedFileGroup === group
                                  ? 'bg-aws-slate text-white shadow-sm'
                                  : 'bg-aws-gray-100 text-aws-gray-500 hover:bg-aws-gray-200 hover:text-aws-slate'
                              }`}
                            >
                              {group}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visual grid rendering of matching assets */}
                      {filteredFileList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {filteredFileList.map((file) => renderAttachmentPreview(file))}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-aws-gray-400">
                          <Archive size={32} className="text-aws-gray-300 mx-auto mb-2" />
                          <p className="text-xs">No assets matching selection criteria.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UNIFIED TIMELINE TAB */}
                  {workspaceTab === 'timeline' && (
                    <div className="max-w-xl mx-auto space-y-4">
                      <div className="relative border-l border-aws-gray-200 pl-5 ml-3 space-y-5 text-xs py-2">
                        {unifiedTimeline.map((item) => {
                          let badgeStyle = 'bg-aws-gray-100 text-aws-gray-650';
                          let commentPreview = '';

                          if (item.type === 'comment') {
                            badgeStyle = 'bg-teal-50 text-teal-650 border border-teal-200';
                            commentPreview = item.meta.text;
                          } else if (item.type === 'work_update') {
                            badgeStyle = 'bg-orange-50 text-aws-orange border border-aws-orange-light/20';
                            commentPreview = item.meta.description;
                          } else if (item.type === 'review_decision') {
                            badgeStyle = item.meta.decision === 'approved' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-red-50 text-red-650 border border-red-200';
                            commentPreview = item.meta.comment;
                          }

                          return (
                            <div key={item.id} className="relative">
                              {/* Central absolute timeline bullet */}
                              <div className={`absolute left-[-26px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-aws-orange flex items-center justify-center`} />

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-aws-slate text-xs">{item.user?.name || 'Operator'}</span>
                                  <span className="text-aws-gray-500 text-[11px]">{item.title}</span>
                                  <span className="text-[10px] text-aws-gray-400 font-semibold">{formatDate(item.date.toISOString())}</span>
                                </div>

                                {commentPreview && (
                                  <div className="bg-aws-gray-50/70 border border-aws-gray-100 p-2.5 rounded-lg text-aws-gray-600 italic leading-normal text-[11px] mt-1 whitespace-pre-wrap max-w-md">
                                    "{commentPreview}"
                                  </div>
                                )}

                                {item.meta?.attachments && item.meta.attachments.length > 0 && (
                                  <div className="flex gap-1.5 flex-wrap mt-1.5">
                                    {item.meta.attachments.map((file: any) => (
                                      <a
                                        key={file.id}
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 border border-aws-gray-200 rounded bg-white text-[10px] text-aws-gray-500 hover:text-aws-orange"
                                      >
                                        <Paperclip size={9} />
                                        <span>{file.fileName}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {unifiedTimeline.length === 0 && (
                          <div className="text-center py-12 text-aws-gray-400">
                            No log events available for task timeline.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 1/3 Task Metadata Panel */}
                <div className="w-72 border-l border-aws-gray-200 bg-aws-gray-50/30 overflow-y-auto p-5 space-y-5 text-xs hidden md:block">
                  <h3 className="text-xs font-bold text-aws-slate border-b border-aws-gray-150 pb-2 uppercase tracking-wider">
                    Task Metadata
                  </h3>

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-aws-gray-500">Task Owner</span>
                      <span className="font-semibold text-aws-slate">{task.createdBy?.name || 'Core Admin'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-aws-gray-500">Assignee</span>
                      {isEditing ? (
                        <select
                          value={editAssignedToId}
                          onChange={e => setEditAssignedToId(e.target.value)}
                          className="p-1 border border-aws-gray-200 bg-white rounded-lg text-[11px] w-36 focus:outline-none"
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
                      <span className="text-aws-gray-500">Assigned Reviewer</span>
                      {isEditing ? (
                        <select
                          value={task.reviewAssignedToId || 'unassigned'}
                          onChange={e => {
                            const val = e.target.value;
                            setTask((prev: any) => ({ ...prev, reviewAssignedToId: val === 'unassigned' ? null : val }));
                          }}
                          className="p-1 border border-aws-gray-200 bg-white rounded-lg text-[11px] w-36 focus:outline-none"
                        >
                          <option value="unassigned">Unassigned</option>
                          {crewList.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : task.reviewAssignedTo ? (
                        <span className="font-semibold text-aws-slate">{task.reviewAssignedTo.name}</span>
                      ) : (
                        <span className="italic text-aws-gray-400">Unassigned</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-aws-gray-500">Priority</span>
                      {isEditing ? (
                        <select
                          value={editPriority}
                          onChange={e => setEditPriority(e.target.value as Priority)}
                          className="p-1 border border-aws-gray-200 bg-white rounded-lg text-[11px] focus:outline-none"
                        >
                          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      ) : (
                        <PriorityBadge priority={task.priority} />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-aws-gray-500">Category</span>
                      {isEditing ? (
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value as TaskCategory)}
                          className="p-1 border border-aws-gray-200 bg-white rounded-lg text-[11px] focus:outline-none"
                        >
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      ) : (
                        <span className="font-semibold text-aws-slate px-2 py-0.5 rounded-full bg-aws-slate/5 border border-aws-gray-100 text-[10px]">
                          {task.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-aws-gray-500">Due Date</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={e => setEditDueDate(e.target.value)}
                          className="p-1 border border-aws-gray-200 bg-white rounded-lg text-[11px] focus:outline-none"
                        />
                      ) : (
                        <span className={`font-semibold ${overdue ? 'text-red-500 font-bold' : 'text-aws-slate'}`}>{formatDate(task.dueDate)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-aws-gray-500">Progress</span>
                      <span className="font-bold text-aws-orange text-xs">{task.progress}%</span>
                    </div>
                  </div>

                  {/* Inline Status Adjuster */}
                  <div className="border-t border-aws-gray-200 pt-4 flex flex-col gap-2">
                    <span className="font-bold text-aws-slate uppercase block text-[10px] tracking-wider">Update Status</span>
                    <select
                      disabled={isUpdatingStatus}
                      value={task.status}
                      onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                      className="w-full border border-aws-gray-200 p-2 rounded-lg bg-white font-semibold focus:outline-none cursor-pointer premium-input text-xs"
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
