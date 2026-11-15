import React from 'react';

const LEVEL_COLORS = {
  beginner:     'bg-sky-50 text-sky-700 border-sky-200',
  intermediate: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  advanced:     'bg-violet-50 text-violet-700 border-violet-200',
};

export default function SkillChip({ name, level }) {
  const cls = level ? (LEVEL_COLORS[level.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200') : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {name}
      {level && (
        <span className="opacity-60 text-[10px]">· {level}</span>
      )}
    </span>
  );
}
