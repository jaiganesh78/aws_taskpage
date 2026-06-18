'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';
import type { CrewMember } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface UserContextType {
  currentUser: CrewMember | null;
  users: CrewMember[];
  setCurrentUserById: (id: string) => void;
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
  addToast: (message: string, type: 'success' | 'error') => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CrewMember | null>(null);
  const [users, setUsers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const refreshUsers = async () => {
    try {
      const { data: allUsers } = await api.getUsers({ includeInactive: true });
      setUsers(allUsers);
      
      if (currentUser) {
        const updated = allUsers.find(u => u.id === currentUser.id);
        if (updated) {
          setCurrentUser(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load users context', err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        let allUsers;
        try {
          const res = await api.getUsers({ includeInactive: true });
          allUsers = res.data;
        } catch (err) {
          console.warn('Failing with stale user context. Clearing selected_user_id and retrying...', err);
          localStorage.removeItem('selected_user_id');
          // Reload page once to clear memory state or call api with empty header
          const res = await api.getUsers({ includeInactive: true });
          allUsers = res.data;
        }
        
        setUsers(allUsers);
        
        let storedId = localStorage.getItem('selected_user_id');
        if (!storedId && allUsers.length > 0) {
          const coreUser = allUsers.find(u => u.role === 'core');
          storedId = coreUser ? coreUser.id : allUsers[0].id;
        }
        
        if (storedId) {
          const matched = allUsers.find(u => u.id === storedId);
          if (matched) {
            setCurrentUser(matched);
            localStorage.setItem('selected_user_id', matched.id);
          } else if (allUsers.length > 0) {
            setCurrentUser(allUsers[0]);
            localStorage.setItem('selected_user_id', allUsers[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize users context', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleError = (e: Event) => {
        const customEvent = e as CustomEvent;
        const msg = customEvent.detail?.message || 'API request failed';
        addToast(msg, 'error');
      };
      
      const handleSuccess = (e: Event) => {
        const customEvent = e as CustomEvent;
        const msg = customEvent.detail || 'Action completed successfully';
        addToast(msg, 'success');
      };

      window.addEventListener('api-error', handleError);
      window.addEventListener('api-success', handleSuccess);

      return () => {
        window.removeEventListener('api-error', handleError);
        window.removeEventListener('api-success', handleSuccess);
      };
    }
  }, []);

  const setCurrentUserById = (id: string) => {
    const matched = users.find(u => u.id === id);
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem('selected_user_id', matched.id);
      window.location.reload();
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUserById,
        isLoading,
        refreshUsers,
        addToast,
      }}
    >
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border glass-card-strong shadow-lg backdrop-blur-md"
              style={{
                borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
              }}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              ) : (
                <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
              )}
              <div className="flex-1 text-sm font-medium text-aws-slate leading-tight">
                {toast.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
