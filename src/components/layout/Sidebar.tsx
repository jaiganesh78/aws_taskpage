'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Task Assignment', icon: LayoutDashboard, color: '#FF9900' },
  { href: '/crew', label: 'Crew Dashboard', icon: Users, color: '#232F3E' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, color: '#8B5CF6' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl glass-card flex items-center justify-center"
      >
        <Menu size={20} className="text-aws-slate" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col',
          'transition-all duration-300 ease-in-out',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full flex flex-col glass-card-strong rounded-none lg:rounded-r-2xl"
        >
          <div className="flex items-center gap-3 px-5 h-[72px] border-b border-aws-gray-100">
            <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-aws-orange/20 flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-sm font-bold text-aws-slate leading-tight">AWS SBG REC</div>
                <div className="text-[10px] text-aws-gray-500 font-medium">Task Operations</div>
              </motion.div>
            )}
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive
                        ? 'bg-aws-orange/8 text-aws-orange font-semibold'
                        : 'text-aws-gray-600 hover:text-aws-slate hover:bg-aws-gray-50',
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 w-1 h-6 rounded-full gradient-orange"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <item.icon
                      size={20}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        isActive ? 'text-aws-orange' : 'text-aws-gray-400 group-hover:text-aws-slate',
                      )}
                    />
                    {!collapsed && (
                      <span className="text-sm whitespace-nowrap">{item.label}</span>
                    )}
                    {!collapsed && isActive && (
                      <ChevronRight size={14} className="ml-auto text-aws-orange/50" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-5 py-4 border-t border-aws-gray-100 text-aws-gray-400 hover:text-aws-slate transition-colors"
          >
            <Menu size={18} />
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>

          {!collapsed && (
            <div className="px-4 pb-4">
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-aws-orange/[0.04] to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-aws-orange animate-pulse-soft" />
                  <span className="text-xs font-medium text-aws-orange">Live Event</span>
                </div>
                <p className="text-xs text-aws-gray-600 leading-relaxed">
                  AWS Cloud Summit 2026
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-aws-gray-100">
                    <div className="h-full w-[65%] rounded-full bg-aws-orange" />
                  </div>
                  <span className="text-[10px] font-medium text-aws-gray-500">65%</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </aside>

      <button
        onClick={() => setMobileOpen(false)}
        className={cn(
          'lg:hidden fixed top-4 left-[calc(260px-3rem)] z-50 w-8 h-8 rounded-lg glass-card flex items-center justify-center',
          mobileOpen ? 'block' : 'hidden',
        )}
      >
        <X size={16} className="text-aws-slate" />
      </button>
    </>
  );
}
