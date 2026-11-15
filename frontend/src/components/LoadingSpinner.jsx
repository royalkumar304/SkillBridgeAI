import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}
