import React from 'react';

const STATUS_STYLES = {
  applied:            'bg-blue-50 text-blue-700 border-blue-200',
  under_review:       'bg-yellow-50 text-yellow-700 border-yellow-200',
  shortlisted:        'bg-green-50 text-green-700 border-green-200',
  interview_scheduled:'bg-purple-50 text-purple-700 border-purple-200',
  rejected:           'bg-red-50 text-red-700 border-red-200',
  selected:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  active:             'bg-green-50 text-green-700 border-green-200',
  draft:              'bg-slate-100 text-slate-600 border-slate-200',
  closed:             'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABELS = {
  applied:            'Applied',
  under_review:       'Under Review',
  shortlisted:        'Shortlisted',
  interview_scheduled:'Interview Scheduled',
  rejected:           'Rejected',
  selected:           'Selected',
  active:             'Active',
  draft:              'Draft',
  closed:             'Closed',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const cls = STATUS_STYLES[key] || 'bg-slate-100 text-slate-600 border-slate-200';
  const label = STATUS_LABELS[key] || status || '—';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {label}
    </span>
  );
}
