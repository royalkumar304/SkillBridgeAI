import React from 'react';

const STATUS_STYLES = {
  applied:            'bg-[#F0F5FF] text-[#2563EB] border-[#2563EB]/25',
  under_review:       'bg-amber-50 text-amber-800 border-amber-200',
  shortlisted:        'bg-emerald-50 text-emerald-800 border-emerald-200',
  interview_scheduled:'bg-indigo-50 text-[#6366F1] border-[#6366F1]/25',
  rejected:           'bg-rose-50 text-rose-700 border-rose-200',
  selected:           'bg-teal-50 text-teal-800 border-teal-200',
  active:             'bg-emerald-50 text-emerald-800 border-emerald-200',
  published:          'bg-emerald-50 text-emerald-800 border-emerald-200',
  draft:              'bg-slate-100 text-slate-600 border-slate-200',
  closed:             'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABELS = {
  applied:            'Applied',
  under_review:       'Under Review',
  shortlisted:        'Shortlisted',
  interview_scheduled:'Interview Scheduled',
  rejected:           'Rejected',
  selected:           'Selected',
  active:             'Active',
  published:          'Published',
  draft:              'Draft',
  closed:             'Closed',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const cls = STATUS_STYLES[key] || 'bg-slate-100 text-slate-600 border-slate-200';
  const label = STATUS_LABELS[key] || status || '—';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls} shadow-2xs tracking-wide`}
    >
      {label}
    </span>
  );
}
