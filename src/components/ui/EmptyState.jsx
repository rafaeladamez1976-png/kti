import React from 'react';
import { cn } from '@/lib/utils';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Icon size={28} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}