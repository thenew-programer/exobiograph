'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function VerifiedBadge({ className, size = 'sm', showLabel = false }: VerifiedBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} title="Verified Scientist">
      <CheckCircle2 className={cn('text-blue-500 fill-blue-50 dark:fill-blue-950', sizeClasses[size])} />
      {showLabel && <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Verified</span>}
    </span>
  );
}
