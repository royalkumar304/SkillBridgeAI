import React from 'react';

const LEVEL_COLORS = {
  beginner:     'bg-[#F0F5FF] text-[#2563EB] border-[#2563EB]/25',
  intermediate: 'bg-indigo-50 text-[#6366F1] border-[#6366F1]/25',
  advanced:     'bg-[#142B55]/10 text-[#142B55] border-[#142B55]/25',
};

export default function SkillChip({ name, level }) {
  const cls = level ? (LEVEL_COLORS[level.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200') : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls} shadow-2xs`}>
      <span>{name}</span>
      {level && (
        <span className="opacity-75 text-[10px] font-semibold uppercase tracking-wider">· {level}</span>
      )}
    </span>
  );
}
