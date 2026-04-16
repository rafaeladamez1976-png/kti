import React from 'react';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, icon: Icon, color = "emerald", subtitle }) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    red: "bg-red-50 text-red-600 border-red-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const iconColorClasses = {
    emerald: "bg-emerald-100 text-emerald-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className={cn(
      "bg-white rounded-xl border p-5 transition-all hover:shadow-md",
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-lg", iconColorClasses[color])}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}