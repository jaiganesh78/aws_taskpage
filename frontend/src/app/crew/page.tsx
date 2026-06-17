'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useUser } from '@/lib/user-context';
import { api } from '@/lib/api';
import type { CrewMember } from '@/lib/types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  UserCheck,
  UserX,
  Mail,
  Building,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function CrewManagementPage() {
  const { currentUser, refreshUsers } = useUser();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCrew = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCrew({ includeInactive });
      // Filter out core users just in case
      const crewOnly = res.data.filter(u => u.role === 'crew');
      setCrew(crewOnly);
    } catch (err) {
      console.error('Failed to fetch crew list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'core') {
      fetchCrew();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, includeInactive]);

  const handleCreateCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);
    try {
      await api.createCrew({ name, email, department });
      setName('');
      setEmail('');
      setDepartment('');
      fetchCrew();
      refreshUsers(); // refresh the header context list
    } catch (err) {
      // toast is dispatched inside api.ts
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    try {
      await api.deactivateCrew(id, name);
      fetchCrew();
      refreshUsers(); // refresh context switcher list
    } catch (err) {
      // toast is handled inside api.ts
    }
  };

  if (isLoading && !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-aws-gray-500">Loading user context...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Access check
  if (currentUser?.role !== 'core') {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-12">
          <GlassCard strong glow="slate" className="text-center py-10 px-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-lg font-bold text-aws-slate">Access Denied</h2>
            <p className="text-sm text-aws-gray-500">
              You do not have permissions to view crew management tools.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-aws-orange hover:text-aws-orange-dark transition-all mt-2"
            >
              Back to Dashboard
              <ArrowUpRight size={14} />
            </Link>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  // Filter crew list based on local search term
  const filteredCrew = crew.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.department && c.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Header
          title="Crew Management Dashboard"
          subtitle="Manage active staff assignments, workloads, and directory operations"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left panel: Add Crew form */}
          <div className="space-y-4">
            <GlassCard strong glow="orange">
              <h3 className="text-base font-semibold text-aws-slate mb-4 flex items-center gap-2">
                <UserPlus size={16} className="text-aws-orange" />
                Add Crew Member
              </h3>

              <form onSubmit={handleCreateCrew} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-aws-gray-600 flex items-center gap-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-aws-gray-600 flex items-center gap-1.5">
                    <Mail size={12} /> Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-aws-gray-600 flex items-center gap-1.5">
                    <Building size={12} /> Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="E.g. Logistics, Technical"
                    className="w-full px-3 py-2 rounded-lg border border-aws-gray-200 bg-white text-sm text-aws-slate placeholder-aws-gray-400 focus:outline-none focus:ring-2 focus:ring-aws-orange/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !name || !email}
                  className="w-full mt-2 py-2 rounded-lg text-sm font-semibold bg-aws-orange text-white hover:bg-aws-orange-dark disabled:bg-aws-gray-200 disabled:text-aws-gray-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  {isSubmitting ? 'Adding...' : 'Create Crew Member'}
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Right panel: Crew list and workloads */}
          <div className="lg:col-span-2">
            <GlassCard strong className="h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <SectionHeader
                  title="Staff Directory"
                  subtitle="Track workloads, overdue tasks, and toggle staff statuses"
                />

                <div className="flex items-center gap-3">
                  <div className="relative max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-aws-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search crew members..."
                      className="pl-9 pr-3 py-1.5 rounded-lg border border-aws-gray-200 bg-white text-xs text-aws-slate focus:outline-none focus:ring-2 focus:ring-aws-orange/20 w-44 sm:w-56"
                    />
                  </div>
                  <button
                    onClick={() => setIncludeInactive(!includeInactive)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      includeInactive
                        ? 'bg-aws-orange/8 border-aws-orange/30 text-aws-orange'
                        : 'border-aws-gray-200 text-aws-gray-500 hover:border-aws-gray-300'
                    }`}
                  >
                    <Filter size={11} />
                    Show Inactive
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-aws-gray-400 text-sm">
                  Loading staff list...
                </div>
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-aws-gray-100 pb-2">
                        <th className="pb-3 text-xs font-bold text-aws-gray-500 uppercase tracking-wider">Name</th>
                        <th className="pb-3 text-xs font-bold text-aws-gray-500 uppercase tracking-wider">Workload</th>
                        <th className="pb-3 text-xs font-bold text-aws-gray-500 uppercase tracking-wider text-center">Tasks (Act / Comp)</th>
                        <th className="pb-3 text-xs font-bold text-aws-gray-500 uppercase tracking-wider text-center">Overdue</th>
                        <th className="pb-3 text-xs font-bold text-aws-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredCrew.map((member, i) => {
                          const hasActiveTasks = (member.activeTaskCount || 0) > 0;
                          return (
                            <motion.tr
                              key={member.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className={`border-b border-aws-gray-50 group hover:bg-aws-gray-50/50 transition-colors ${
                                !member.isActive ? 'opacity-55' : ''
                              }`}
                            >
                              <td className="py-3 pr-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full gradient-slate flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                    {getInitials(member.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-aws-slate flex items-center gap-1.5">
                                      <span className={!member.isActive ? 'italic' : ''}>{member.name}</span>
                                      {member.isActive ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active" />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Inactive" />
                                      )}
                                    </div>
                                    <div className="text-[10px] text-aws-gray-400 truncate">
                                      {member.email} • {member.department || 'No department'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 pr-2">
                                {member.isActive ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    member.workloadStatus === 'overloaded'
                                      ? 'bg-red-500/10 text-red-500'
                                      : member.workloadStatus === 'busy'
                                      ? 'bg-yellow-500/10 text-yellow-600'
                                      : 'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                    {member.workloadStatus?.toUpperCase() || 'AVAILABLE'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-aws-gray-400 italic">Archived</span>
                                )}
                              </td>

                              <td className="py-3 text-center text-sm font-semibold text-aws-slate pr-2">
                                {member.activeTaskCount || 0} / {member.completedTaskCount || 0}
                              </td>

                              <td className="py-3 text-center pr-2">
                                <span className={`text-sm font-bold ${
                                  (member.overdueTaskCount || 0) > 0 ? 'text-red-500' : 'text-aws-gray-500'
                                }`}>
                                  {member.overdueTaskCount || 0}
                                </span>
                              </td>

                              <td className="py-3 text-right">
                                {member.isActive ? (
                                  <button
                                    onClick={() => handleDeactivate(member.id, member.name)}
                                    disabled={hasActiveTasks}
                                    title={hasActiveTasks ? 'Cannot deactivate. Member has active tasks assigned.' : 'Deactivate crew member'}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                      hasActiveTasks
                                        ? 'border-aws-gray-100 bg-aws-gray-50 text-aws-gray-400 cursor-not-allowed'
                                        : 'border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50 hover:border-red-300'
                                    }`}
                                  >
                                    <UserX size={12} />
                                    Deactivate
                                  </button>
                                ) : (
                                  <span className="text-xs text-aws-gray-400 font-medium italic">Deactivated</span>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  {filteredCrew.length === 0 && (
                    <div className="text-center py-12 text-aws-gray-400 text-sm">
                      No crew members match your search.
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}