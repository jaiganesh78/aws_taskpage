'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Paperclip, 
  Calendar, 
  User, 
  Clock, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';

interface ReviewQueueItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  status: string;
  progress: number;
  submittedAt: string;
  sla: 'fresh' | 'waiting' | 'overdue';
  assignedTo: any;
  reviewAssignedTo: any;
  latestRevision: {
    id: string;
    description: string;
    progress: number;
    revisionNumber: number;
    attachments: any[];
    createdAt: string;
  } | null;
}

interface ReviewsWorkspaceProps {
  reviewQueue: ReviewQueueItem[];
  onRefresh: () => void;
  onSelectTask: (taskId: string) => void;
}

export function ReviewsWorkspace({
  reviewQueue,
  onRefresh,
  onSelectTask
}: ReviewsWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-aws-gray-200">
        <div>
          <h2 className="text-sm font-bold text-aws-slate uppercase tracking-wider">Awaiting Review Queue</h2>
          <p className="text-xs text-aws-gray-500 mt-0.5">Validate crew submissions, review uploaded evidence, and register operational decisions.</p>
        </div>
        <span className="bg-aws-slate text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm shadow-aws-slate/10">
          {reviewQueue.length} Active Submissions
        </span>
      </div>

      <div className="space-y-4">
        {reviewQueue.map((item) => (
          <ReviewQueueCard 
            key={item.id} 
            item={item} 
            onRefresh={onRefresh} 
            onSelectTask={onSelectTask} 
          />
        ))}

        {reviewQueue.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed border-aws-gray-250 rounded-xl">
            <CheckCircle size={36} className="text-emerald-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-aws-slate">Queue is Empty</h3>
            <p className="text-xs text-aws-gray-400 mt-1">Excellent! All submitted tasks have been successfully reviewed and resolved.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewQueueCard({ 
  item, 
  onRefresh, 
  onSelectTask 
}: { 
  item: ReviewQueueItem; 
  onRefresh: () => void; 
  onSelectTask: (taskId: string) => void;
}) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevReviewsCount, setPrevReviewsCount] = useState<number | null>(null);

  // Fetch previous reviews count
  useEffect(() => {
    let active = true;
    api.getReviews(item.id)
      .then(res => {
        if (active) setPrevReviewsCount(res.length);
      })
      .catch(console.error);
    return () => { active = false; };
  }, [item.id]);

  const handleDecision = async (decision: 'approved' | 'changes_requested') => {
    if (!feedback.trim()) {
      alert('Feedback comment is required before submitting review decision.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.submitReviewDecision(item.id, {
        decision,
        comment: feedback.trim()
      });
      setFeedback('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slaBadgeColor = {
    fresh: 'bg-emerald-50 text-emerald-600 border-emerald-250',
    waiting: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    overdue: 'bg-red-50 text-red-650 border-red-250 animate-pulse'
  };

  const slaLabel = {
    fresh: 'Fresh (under 4h)',
    waiting: 'Awaiting (4-24h)',
    overdue: 'Critical (24h+)'
  };

  return (
    <div className="bg-white border border-aws-gray-200 rounded-xl shadow-sm hover:border-aws-gray-250 transition-all overflow-hidden flex flex-col">
      {/* Upper Info Row */}
      <div className="p-5 border-b border-aws-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Submitter & Task Details */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${slaBadgeColor[item.sla]}`}>
              {slaLabel[item.sla]}
            </span>
            <PriorityBadge priority={item.priority as any} />
          </div>
          <div>
            <h3 
              onClick={() => onSelectTask(item.id)}
              className="text-sm font-bold text-aws-slate hover:text-aws-orange hover:underline cursor-pointer truncate"
            >
              {item.name}
            </h3>
            <p className="text-[11px] text-aws-gray-500 mt-0.5 capitalize">Category: {item.category.replace('_', ' ')}</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full gradient-slate flex items-center justify-center text-[9px] font-bold text-white shadow-sm flex-shrink-0">
              {getInitials(item.assignedTo?.name || 'C')}
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-bold text-aws-slate block">{item.assignedTo?.name || 'Crew Member'}</span>
              <span className="text-[10px] text-aws-gray-400">Submitted {formatDate(item.submittedAt)}</span>
            </div>
          </div>
        </div>

        {/* Center Column: Revision Info & Descriptions */}
        <div className="lg:col-span-2 space-y-2 bg-aws-gray-50/50 border border-aws-gray-150 p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs">
            <span className="text-aws-slate font-bold">
              Revision {item.latestRevision?.revisionNumber || 1} Work Update
            </span>
            {prevReviewsCount !== null && prevReviewsCount > 0 && (
              <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                <History size={11} /> Previous Reviews: {prevReviewsCount}
              </span>
            )}
          </div>
          
          <p className="text-xs text-aws-gray-700 leading-relaxed italic line-clamp-3">
            "{item.latestRevision?.description || 'No submission notes logged.'}"
          </p>

          {/* Files Attachments Row */}
          {item.latestRevision?.attachments && item.latestRevision.attachments.length > 0 && (
            <div className="pt-2 border-t border-aws-gray-100 flex gap-2 flex-wrap">
              {item.latestRevision.attachments.map((file: any) => {
                const isImg = file.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.fileName);
                return (
                  <a
                    key={file.id || file.fileUrl}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-aws-gray-200 rounded-lg bg-white text-[11px] text-aws-gray-600 hover:text-aws-orange transition-all hover:border-aws-orange/30 shadow-sm"
                  >
                    {isImg ? <ImageIcon size={11} /> : <Paperclip size={11} />}
                    <span className="truncate max-w-[120px] font-medium">{file.fileName}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Inline Action Form */}
      <div className="px-5 py-4 bg-aws-gray-50/20 border-t border-aws-gray-100 flex flex-col md:flex-row gap-3 items-end md:items-center justify-between">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Add mandatory review feedback for the decision..."
            className="w-full pl-3 pr-4 py-2 border border-aws-gray-200 rounded-xl bg-white text-xs text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/15 transition-all"
          />
        </div>

        <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
          <button
            type="button"
            disabled={isSubmitting || !feedback.trim()}
            onClick={() => handleDecision('changes_requested')}
            className="flex-1 md:flex-initial px-4 py-2 bg-white border border-red-200 hover:border-red-300 text-red-650 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
          >
            <AlertTriangle size={13} />
            Request Changes
          </button>
          <button
            type="button"
            disabled={isSubmitting || !feedback.trim()}
            onClick={() => handleDecision('approved')}
            className="flex-1 md:flex-initial px-4 py-2 bg-aws-slate hover:bg-aws-slate-light text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:bg-aws-gray-200 disabled:text-aws-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md shadow-aws-slate/10"
          >
            <ShieldCheck size={13} />
            Approve Task
          </button>
        </div>
      </div>
    </div>
  );
}

const ImageIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
