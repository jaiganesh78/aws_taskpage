'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full gradient-orange" />
            <h1 className="text-2xl font-bold text-aws-slate">{title}</h1>
          </div>
          {subtitle && (
            <p className="text-sm text-aws-gray-500 ml-4">{subtitle}</p>
          )}
        </div>

        {eventName && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-shrink-0"
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
