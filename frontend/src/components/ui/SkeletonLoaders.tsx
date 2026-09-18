import React from 'react';

// Skeleton loader placeholder for material cards during API data fetches.
export const MaterialCardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
      <div className="w-16 h-5 bg-slate-200 rounded-full"></div>
    </div>
    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
    <div className="h-4 bg-slate-100 rounded w-full"></div>
    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
    </div>
  </div>
);

// Skeleton loader placeholder for table rows.
export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
    <td className="px-4 py-3"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
    <td className="px-4 py-3 text-right"><div className="h-7 bg-slate-200 rounded-lg w-16 inline-block"></div></td>
  </tr>
);
