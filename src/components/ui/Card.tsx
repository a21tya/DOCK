import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  badge,
  action,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass-card rounded-xl border border-white/[0.08] overflow-hidden flex flex-col',
        className
      )}
      {...props}
    >
      {(title || action || badge) && (
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-white/[0.01]">
          <div className="flex items-center gap-2.5 min-w-0">
            {title && (
              <h3 className="font-semibold text-sm text-slate-200 tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <span className="text-xs text-slate-500 font-normal">
                {subtitle}
              </span>
            )}
            {badge}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
};
