'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-center justify-between mb-5', className)}
    >
      <div>
        <h2 className="text-lg font-semibold text-aws-slate">{title}</h2>
        {subtitle && (
          <p className="text-sm text-aws-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
