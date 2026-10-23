import React from 'react';
import { Type } from 'lucide-react';

export type TextSize = 'sm' | 'base' | 'lg' | 'xl';

interface TextSizeControlsProps {
  currentSize: TextSize;
  onChange: (size: TextSize) => void;
  className?: string;
}

export const TextSizeControls: React.FC<TextSizeControlsProps> = ({
  currentSize,
  onChange,
  className = '',
}) => {
  const sizes: { id: TextSize; label: string; title: string }[] = [
    { id: 'sm', label: 'A-', title: 'Small text' },
    { id: 'base', label: 'A', title: 'Default text' },
    { id: 'lg', label: 'A+', title: 'Large text' },
    { id: 'xl', label: 'A++', title: 'Extra large text' },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl border border-slate-700/60 bg-slate-800/80 text-xs shadow-sm ${className}`}
      role="group"
      aria-label="Text zoom size controls"
    >
      <Type className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
      {sizes.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          title={s.title}
          aria-label={s.title}
          className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
            currentSize === s.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

export function getTextSizeClass(size: TextSize): string {
  switch (size) {
    case 'sm':
      return 'text-xs';
    case 'base':
      return 'text-sm';
    case 'lg':
      return 'text-base';
    case 'xl':
      return 'text-lg';
    default:
      return 'text-sm';
  }
}

