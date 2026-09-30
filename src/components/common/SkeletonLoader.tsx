import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs animate-pulse flex flex-col justify-between">
      <div className="h-44 sm:h-52 bg-slate-100 flex items-center justify-center p-3 relative">
        <div className="w-20 h-20 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          <div className="h-5 bg-slate-200 rounded w-1/3 mt-2"></div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex gap-1.5 mt-2">
          <div className="h-9 bg-slate-200 rounded-lg flex-1"></div>
          <div className="h-9 bg-slate-200 rounded-lg flex-1"></div>
        </div>
      </div>
    </div>
  );
};

export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          <div className="h-7 bg-slate-200 rounded w-3/4"></div>
          <div className="h-2.5 bg-slate-100 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
};
