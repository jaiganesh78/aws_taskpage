'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'orange' | 'slate' | 'white' | 'none';
  hover?: boolean;
  strong?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  glow = 'none',
  hover = true,
  strong = false,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={cn(
        strong ? 'glass-card-strong' : 'glass-card',
        glow === 'orange' && 'orange-glow orange-border-glow',
        glow === 'slate' && 'slate-glow',
        glow === 'white' && 'white-glow',
        'rounded-xl p-5 transition-all duration-300',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
