'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { CategoryProgress } from '@/components/analytics/CategoryProgress';
import { CrewContribution } from '@/components/analytics/CrewContribution';
import { StatusDistribution } from '@/components/analytics/StatusDistribution';
import { Leaderboard } from '@/components/analytics/Leaderboard';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { tasks, crewMembers } from '@/lib/mockData';
import {
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const stats = useMemo(() => ({
    total: tasks.length,
    assigned: tasks.filter(t => t.assignedTo !== null).length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    rate: tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0,
  }), []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Analytics Dashboard"
          subtitle="Event execution insights and team performance — AWS SBG REC"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <StatCard label="Total Tasks" value={stats.total} icon={<ClipboardList size={16} />} color="slate" />
          <StatCard label="Assigned" value={stats.assigned} icon={<UserCheck size={16} />} color="info" />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={16} />} color="success" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock size={16} />} color="warning" />
          <StatCard label="Completion Rate" value={stats.rate} suffix="%" icon={<TrendingUp size={16} />} color="orange" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryProgress tasks={tasks} />
          <StatusDistribution tasks={tasks} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CrewContribution members={crewMembers} tasks={tasks} />
          <Leaderboard members={crewMembers} tasks={tasks} />
        </div>

        <SectionHeader
          title="Activity Summary"
          subtitle="Overall project health and metrics"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
                <Activity size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-aws-gray-500 font-medium">Event Readiness</div>
                <div className="text-xl font-bold text-aws-slate">
                  {Math.round(tasks.reduce((s, t) => s + t.completionPercentage, 0) / tasks.length)}%
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-slate flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-aws-gray-500 font-medium">Active Crew</div>
                <div className="text-xl font-bold text-aws-slate">
                  {crewMembers.filter(m =>
                    tasks.some(t => t.assignedTo?.id === m.id && t.status !== 'completed'),
                  ).length}
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-aws-gray-500 font-medium">Task Categories</div>
                <div className="text-xl font-bold text-aws-slate">3</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Users({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
