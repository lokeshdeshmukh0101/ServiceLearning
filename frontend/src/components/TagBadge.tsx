import React from 'react';
import { Tag as TagIcon } from 'lucide-react';

interface TagBadgeProps {
  name: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ name, active, onClick, onRemove }) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer border ${
        active
          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white'
      }`}
    >
      <TagIcon className="w-3 h-3 text-sky-400" />
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 text-slate-400 hover:text-rose-400 font-bold"
        >
          ×
        </button>
      )}
    </span>
  );
};
