'use client';

import React from 'react';
import { 
  UserPlus, 
  UserMinus, 
  Check, 
  AlertCircle, 
  Mail, 
  Building,
  UserX,
  Plus
} from 'lucide-react';
import type { CrewMember } from '@/lib/types';
import { getInitials } from '@/lib/utils';

interface CrewWorkspaceProps {
  crewList: CrewMember[];
  onOpenAddCrew: () => void;
  onDeactivateCrew: (id: string, name: string) => void;
  isCore: boolean;
}

export function CrewWorkspace({
  crewList,
  onOpenAddCrew,
  onDeactivateCrew,
  isCore
}: CrewWorkspaceProps) {

  const workloadBadgeColor = {
    available: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    busy: 'bg-amber-50 text-yellow-750 border-yellow-250',
    overloaded: 'bg-red-50 text-red-650 border-red-250'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 pb-2 border-b border-aws-gray-200">
        <div>
          <h2 className="text-sm font-bold text-aws-slate uppercase tracking-wider">Crew Directory</h2>
          <p className="text-xs text-aws-gray-500 mt-0.5">Manage operator profiles, monitor active workloads, and track team capacity.</p>
        </div>
        {isCore && (
          <button
            onClick={onOpenAddCrew}
            className="px-3.5 py-2 bg-aws-orange hover:bg-aws-orange-dark text-white rounded-lg text-xs font-bold shadow-md shadow-aws-orange/15 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={13} /> Enroll Crew Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crewList.map((member) => (
          <div 
            key={member.id}
            className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between min-h-[170px] ${
              member.isActive ? 'border-aws-gray-150 hover:border-aws-gray-200' : 'border-aws-gray-200 bg-aws-gray-50/40 opacity-70'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-slate flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-aws-slate truncate text-sm ${!member.isActive && 'italic'}`}>
                      {member.name} {!member.isActive && '(Inactive)'}
                    </h3>
                    <p className="text-xs text-aws-gray-550 flex items-center gap-1 mt-0.5 truncate">
                      <Mail size={12} className="text-aws-gray-400 flex-shrink-0" />
                      <span>{member.email}</span>
                    </p>
                  </div>
                </div>

                {member.isActive && member.workloadStatus && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border flex-shrink-0 ${workloadBadgeColor[member.workloadStatus]}`}>
                    {member.workloadStatus}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-aws-gray-100 text-center text-[10px]">
                <div>
                  <span className="text-aws-slate font-bold text-xs block">{member.activeTaskCount ?? 0}</span>
                  <span className="text-aws-gray-450 block">Active Tasks</span>
                </div>
                <div>
                  <span className="text-aws-slate font-bold text-xs block">{member.completedTaskCount ?? 0}</span>
                  <span className="text-aws-gray-450 block">Completed</span>
                </div>
                <div>
                  <span className={`font-bold text-xs block ${member.overdueTaskCount && member.overdueTaskCount > 0 ? 'text-red-500' : 'text-aws-slate'}`}>
                    {member.overdueTaskCount ?? 0}
                  </span>
                  <span className="text-aws-gray-455 block">Overdue</span>
                </div>
              </div>
            </div>

            {isCore && member.isActive && member.role !== 'core' && (
              <div className="border-t border-aws-gray-100 pt-3 mt-4 flex justify-end">
                <button
                  onClick={() => onDeactivateCrew(member.id, member.name)}
                  disabled={member.activeTaskCount ? member.activeTaskCount > 0 : false}
                  className="px-2.5 py-1.5 border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={member.activeTaskCount && member.activeTaskCount > 0 ? "Cannot deactivate with active tasks" : "Deactivate Profile"}
                >
                  <UserX size={12} />
                  Deactivate Member
                </button>
              </div>
            )}
          </div>
        ))}

        {crewList.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white border border-dashed border-aws-gray-250 rounded-xl">
            <UserX size={32} className="text-aws-gray-300 mx-auto mb-2" />
            <p className="text-xs text-aws-gray-400">No crew members registered in directory.</p>
          </div>
        )}
      </div>
    </div>
  );
}
