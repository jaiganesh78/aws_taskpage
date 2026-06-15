import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRelative(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days} day${days === 1 ? '' : 's'} left`;
  return formatDate(date);
}

export function isOverdue(date: string): boolean {
  return new Date(date) < new Date() && !isToday(date);
}

export function isToday(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getOverdueDays(dueDate: string, completedAt?: string | null): number {
  const due = new Date(dueDate);
  const end = completedAt ? new Date(completedAt) : new Date();
  const diff = end.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getDelayText(dueDate: string, completedAt?: string | null): string {
  const days = getOverdueDays(dueDate, completedAt);
  if (days === 0) return '';
  if (completedAt) return `Completed ${days} day${days === 1 ? '' : 's'} late`;
  return `Overdue by ${days} day${days === 1 ? '' : 's'}`;
}
