'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  Zap, 
  UserCheck,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';

interface AnalyticsWorkspaceProps {
  analyticsData: {
    averageCompletionTimeHours: number;
    averageReviewTimeHours: number;
    mostActiveCrew: { id: string; name: string; avatar: string | null; updatesCount: number }[];
    mostActiveReviewers: { id: string; name: string; avatar: string | null; reviewsCount: number }[];
    reviewQueueAging: { fresh: number; waiting: number; overdue: number };
    workloadDistribution: { available: number; busy: number; overloaded: number };
    bottlenecks: {
      blockedCount: number;
      overdueCount: number;
      list: { id: string; name: string; status: string; dueDate: string; priority: string }[];
    };
    distributions: {
      byCategory: Record<string, number>;
      byPriority: Record<string, number>;
      byStatus: Record<string, number>;
    };
    completionTrends: { day: string; completed: number }[];
  } | null;
  onSelectTask: (taskId: string) => void;
}

export function AnalyticsWorkspace({ analyticsData, onSelectTask }: AnalyticsWorkspaceProps) {
  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-aws-gray-400">
        <Clock size={32} className="animate-spin text-aws-orange mb-3" />
        <p className="text-xs">Compiling analytical metrics...</p>
      </div>
    );
  }

  // Workload Chart Data
  const workloadChartData = useMemo(() => {
    const d = analyticsData.workloadDistribution;
    return [
      { name: 'Available', value: d.available, color: '#10B981' },
      { name: 'Busy', value: d.busy, color: '#F59E0B' },
      { name: 'Overloaded', value: d.overloaded, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [analyticsData.workloadDistribution]);

  // SLA Aging Chart Data
  const slaChartData = useMemo(() => {
    const age = analyticsData.reviewQueueAging;
    return [
      { name: 'Fresh (<4h)', count: age.fresh, fill: '#10B981' },
      { name: 'Waiting (4-24h)', count: age.waiting, fill: '#F59E0B' },
      { name: 'Overdue (24h+)', count: age.overdue, fill: '#EF4444' }
    ];
  }, [analyticsData.reviewQueueAging]);

  return (
    <div className="space-y-6">
      {/* Upper metrics widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-aws-gray-200 rounded-xl p-4.5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-aws-gray-400 uppercase font-bold tracking-wider block">Average Complete Speed</span>
            <h4 className="text-lg font-bold text-aws-slate mt-0.5">{analyticsData.averageCompletionTimeHours} hrs</h4>
          </div>
        </div>

        <div className="bg-white border border-aws-gray-200 rounded-xl p-4.5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[10px] text-aws-gray-400 uppercase font-bold tracking-wider block">Avg Review Turnaround</span>
            <h4 className="text-lg font-bold text-aws-slate mt-0.5">{analyticsData.averageReviewTimeHours} hrs</h4>
          </div>
        </div>

        <div className="bg-white border border-aws-gray-200 rounded-xl p-4.5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-aws-gray-400 uppercase font-bold tracking-wider block">Overdue Tasks Total</span>
            <h4 className="text-lg font-bold text-aws-slate mt-0.5">{analyticsData.bottlenecks.overdueCount} active</h4>
          </div>
        </div>

        <div className="bg-white border border-aws-gray-200 rounded-xl p-4.5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="text-[10px] text-aws-gray-400 uppercase font-bold tracking-wider block">Blocked Tasks Count</span>
            <h4 className="text-lg font-bold text-aws-slate mt-0.5">{analyticsData.bottlenecks.blockedCount} blocked</h4>
          </div>
        </div>
      </div>

      {/* Main Charts & Bottlenecks Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Bottlenecks (Stuck tasks list) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-aws-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-aws-gray-100">
              <ShieldAlert size={16} className="text-red-500" />
              <h3 className="text-sm font-bold text-aws-slate">Operational Bottlenecks (Stuck / Blocked Tasks)</h3>
            </div>
            
            <div className="space-y-2.5">
              {analyticsData.bottlenecks.list.map(task => (
                <div 
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="p-3 rounded-lg border border-aws-gray-150 hover:border-aws-gray-250 bg-aws-gray-50/20 hover:bg-white flex items-center justify-between gap-4 cursor-pointer transition-all text-xs"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-aws-slate truncate">{task.name}</h4>
                    <span className="text-[10px] text-aws-gray-400 font-medium block mt-0.5">Due {formatDate(task.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={task.priority as any} />
                    <StatusBadge status={task.status as any} />
                  </div>
                </div>
              ))}
              {analyticsData.bottlenecks.list.length === 0 && (
                <p className="text-center text-xs text-aws-gray-400 py-10">No bottlenecks identified in active tasks.</p>
              )}
            </div>
          </div>

          {/* Completion Trends Chart */}
          <div className="bg-white border border-aws-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-aws-orange" />
              <h3 className="text-sm font-bold text-aws-slate">Completion Trends (Last 7 Days)</h3>
            </div>
            <div className="h-60 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.completionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(35, 47, 62, 0.05)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#6C757D', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6C757D', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid rgba(35,47,62,0.1)' }} />
                  <Line type="monotone" dataKey="completed" stroke="#FF9900" strokeWidth={2.5} dot={{ r: 4, fill: '#FF9900', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Side: Crew Workload Pie & Active Operators list */}
        <div className="space-y-6">
          {/* Workload Distribution Pie Chart */}
          <div className="bg-white border border-aws-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-aws-gray-100">
              <Users size={16} className="text-aws-slate" />
              <h3 className="text-sm font-bold text-aws-slate">Crew Workload Distribution</h3>
            </div>
            <div className="h-44 w-full flex items-center justify-center relative">
              {workloadChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workloadChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {workloadChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-aws-gray-400">No active workloads found.</p>
              )}
              {/* Legend overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-xs font-bold text-aws-slate">
                  {analyticsData.workloadDistribution.available + 
                   analyticsData.workloadDistribution.busy + 
                   analyticsData.workloadDistribution.overloaded}
                </span>
                <span className="text-[9px] text-aws-gray-400 uppercase font-semibold">Total Crew</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-2">
              <div className="border border-aws-gray-50 bg-emerald-50/10 p-1.5 rounded-lg">
                <span className="text-emerald-600 font-bold block">{analyticsData.workloadDistribution.available}</span>
                <span className="text-aws-gray-400">Available</span>
              </div>
              <div className="border border-aws-gray-50 bg-amber-50/10 p-1.5 rounded-lg">
                <span className="text-yellow-600 font-bold block">{analyticsData.workloadDistribution.busy}</span>
                <span className="text-aws-gray-400">Busy</span>
              </div>
              <div className="border border-aws-gray-50 bg-red-50/10 p-1.5 rounded-lg">
                <span className="text-red-500 font-bold block">{analyticsData.workloadDistribution.overloaded}</span>
                <span className="text-aws-gray-400">Overloaded</span>
              </div>
            </div>
          </div>

          {/* SLA Aging Queue bar chart */}
          <div className="bg-white border border-aws-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-aws-slate uppercase tracking-wider">Review Queue SLA Aging</h3>
            <div className="h-32 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slaChartData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(35, 47, 62, 0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(35, 47, 62, 0.02)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {slaChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Submitters & Reviewers list */}
          <div className="bg-white border border-aws-gray-200 rounded-xl p-5 shadow-sm space-y-4.5 text-xs">
            <h3 className="text-xs font-bold text-aws-slate uppercase tracking-wider pb-2 border-b border-aws-gray-100">Top Operators</h3>
            
            {/* Active Submitters */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-aws-gray-450 uppercase font-bold tracking-wider block">Most Submissions (Crew)</span>
              {analyticsData.mostActiveCrew.map((crew, idx) => (
                <div key={crew.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-aws-slate/5 flex items-center justify-center text-[9px] font-bold text-aws-slate flex-shrink-0">
                      {getInitials(crew.name)}
                    </div>
                    <span className="truncate font-semibold text-aws-slate">{crew.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-aws-orange">{crew.updatesCount} updates</span>
                </div>
              ))}
            </div>

            {/* Active Reviewers */}
            <div className="space-y-2.5 pt-3 border-t border-aws-gray-100">
              <span className="text-[10px] text-aws-gray-455 uppercase font-bold tracking-wider block">Most Reviews Completed (Core)</span>
              {analyticsData.mostActiveReviewers.map((rev, idx) => (
                <div key={rev.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-aws-slate/5 flex items-center justify-center text-[9px] font-bold text-aws-slate flex-shrink-0">
                      {getInitials(rev.name)}
                    </div>
                    <span className="truncate font-semibold text-aws-slate">{rev.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600">{rev.reviewsCount} reviewed</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
