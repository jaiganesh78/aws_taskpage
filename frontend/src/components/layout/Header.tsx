'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, ChevronDown, User, Server, Shield } from 'lucide-react';
import { useUser } from '@/lib/user-context';
import { api } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  eventName?: string;
  eventStatus?: 'upcoming' | 'completed' | 'ongoing';
}

const statusStyle = {
  upcoming: { bg: 'rgba(255,153,0,0.1)', border: 'rgba(255,153,0,0.3)', color: '#FF9900', dot: '#FF9900', label: 'Upcoming' },
  ongoing:  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#10B981', dot: '#10B981', label: 'Live' },
  completed:{ bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', color: '#6B7280', dot: '#6B7280', label: 'Completed' },
};

export function Header({ title, subtitle, eventName, eventStatus = 'upcoming' }: HeaderProps) {
  const s = statusStyle[eventStatus];
  const { currentUser, users, setCurrentUserById } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check health once on mount
    api.checkHealth()
      .then(() => setHealthStatus('healthy'))
      .catch(() => setHealthStatus('unhealthy'));

    // Set up polling for non-production environments
    if (process.env.NODE_ENV !== 'production') {
      const timer = setInterval(() => {
        api.checkHealth()
          .then(() => setHealthStatus('healthy'))
          .catch(() => setHealthStatus('unhealthy'));
      }, 15000);
      return () => clearInterval(timer);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title and Subtitle */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full gradient-orange" />
            <h1 className="text-2xl font-bold text-aws-slate">{title}</h1>
          </div>
          {subtitle && (
            <p className="text-sm text-aws-gray-500 ml-4">{subtitle}</p>
          )}
        </div>

        {/* Right Controls Container */}
        <div className="flex flex-wrap items-center gap-3 md:self-center">
          {/* Health Banner (Dev only) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-aws-gray-200 bg-white/50 text-xs font-semibold backdrop-blur-sm shadow-sm select-none">
              <Server size={13} className="text-aws-gray-500" />
              <span className="text-[10px] text-aws-gray-500 uppercase tracking-wider mr-1">API:</span>
              {healthStatus === 'checking' && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span>Checking...</span>
                </div>
              )}
              {healthStatus === 'healthy' && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  <span>Healthy</span>
                </div>
              )}
              {healthStatus === 'unhealthy' && (
                <div className="flex items-center gap-1 text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                  <span className="animate-pulse">Offline</span>
                </div>
              )}
            </div>
          )}

          {/* Event Status Badging */}
          {eventName && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{ background: s.bg, borderColor: s.border }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }}
                />
                <Calendar size={12} style={{ color: s.color }} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-medium" style={{ color: s.color }}>
                  {s.label} Event
                </span>
                <span className="text-xs font-bold text-aws-slate">{eventName}</span>
              </div>
            </div>
          )}

          {/* User Context Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-aws-gray-200 bg-white/70 hover:bg-white text-aws-slate font-medium text-xs shadow-sm hover:shadow transition-all duration-200 select-none cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {currentUser?.role === 'core' ? (
                  <Shield size={14} className="text-aws-orange" />
                ) : (
                  <User size={14} className="text-aws-slate/70" />
                )}
                <span>
                  {currentUser
                    ? `${currentUser.name} (${currentUser.role.toUpperCase()}${!currentUser.isActive ? ' - INACTIVE' : ''})`
                    : 'Select User'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-aws-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-64 rounded-xl border border-aws-gray-150 bg-white/95 backdrop-blur-md shadow-lg py-1.5 z-[100] max-h-80 overflow-y-auto"
                >
                  <div className="px-3 py-1.5 border-b border-aws-gray-100 text-[10px] font-bold text-aws-gray-400 uppercase tracking-wider">
                    Select Context Identity
                  </div>
                  {users.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    const displayRole = user.role.toUpperCase();
                    
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUserById(user.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-aws-gray-50 transition-colors cursor-pointer border-b border-aws-gray-50/50 last:border-0 ${
                          !user.isActive ? 'text-aws-gray-400 opacity-60 bg-aws-gray-50/40' : 'text-aws-slate'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User size={14} className={isSelected ? 'text-aws-orange' : !user.isActive ? 'text-aws-gray-300' : 'text-aws-gray-450'} />
                          <span className={`text-xs truncate ${isSelected ? 'font-bold text-aws-orange' : 'font-medium'} ${!user.isActive ? 'italic' : ''}`}>
                            {user.name} ({displayRole}{!user.isActive ? ' - INACTIVE' : ''})
                          </span>
                        </div>
                        {isSelected && (
                          <Check size={14} className="text-aws-orange flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
