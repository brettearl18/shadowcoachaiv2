import React from 'react';
import { components } from '@/styles/designSystem';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const baseClasses = components.badge.base;
  const variantClasses = components.badge[variant];
  const sizeClass = sizeClasses[size];

  return (
    <span className={`
      ${baseClasses}
      ${variantClasses}
      ${sizeClass}
      ${className}
    `}>
      {dot && (
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}; 