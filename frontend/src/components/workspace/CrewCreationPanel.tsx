'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, User, Mail, Building, Send } from 'lucide-react';

interface CrewCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCrew: (data: { name: string; email: string; department?: string }) => void;
}

export function CrewCreationPanel({
  isOpen,
  onClose,
  onCreateCrew
}: CrewCreationPanelProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    onCreateCrew({
      name,
      email,
      department: department || undefined
    });

    // Reset Form
    setName('');
    setEmail('');
    setDepartment('');
    onClose();
  };

  const isValid = name && email;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-aws-slate/10 backdrop-blur-[2px]"
          />

          {/* Slide Over Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative h-full w-full sm:w-[420px] bg-white border-l border-aws-gray-200 drawer-container shadow-2xl flex flex-col z-10 p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-aws-gray-150">
              <div className="flex items-center gap-2">
                <UserPlus size={15} className="text-aws-orange" />
                <h2 className="text-sm font-bold text-aws-slate uppercase tracking-wider">Enroll Crew Member</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full hover:bg-aws-gray-100 flex items-center justify-center text-aws-gray-500 hover:text-aws-slate transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-5 text-xs text-aws-gray-650">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                  <User size={12} className="text-aws-gray-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter full name (e.g. Sam Dev)..."
                  className="w-full px-3 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/15 focus:border-aws-orange/20 transition-all"
                />
              </div>

              {/* Email Profile */}
              <div className="space-y-1.5">
                <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                  <Mail size={12} className="text-aws-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email address (e.g. sam@aws-sbg.org)..."
                  className="w-full px-3 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/15 focus:border-aws-orange/20 transition-all"
                />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="font-bold text-aws-slate uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                  <Building size={12} className="text-aws-gray-400" /> Department (Optional)
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Enter department name (e.g. Technical, Social Media)..."
                  className="w-full px-3 py-2.5 rounded-lg border border-aws-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-aws-orange/15 focus:border-aws-orange/20 transition-all"
                />
              </div>

            </form>

            {/* Footer Form Submit */}
            <div className="pt-3 border-t border-aws-gray-150 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-aws-gray-200 text-aws-gray-500 font-bold hover:bg-aws-gray-50 rounded-xl transition-all cursor-pointer text-center text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                  isValid 
                    ? 'gradient-orange text-white shadow-aws-orange/15 hover:shadow-lg' 
                    : 'bg-aws-gray-200 text-aws-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                <UserPlus size={12} /> Enroll Crew
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
