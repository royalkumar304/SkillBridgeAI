import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ title, roleLabel, items = [] }) {
  return (
    <aside className="w-64 bg-[#111A2E] border-r border-slate-800/80 flex flex-col min-h-[calc(100vh-4rem)] shrink-0">
      <div className="p-5 border-b border-slate-800/80">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
          {roleLabel}
        </span>
        <h2 className="text-base font-bold text-white mt-2.5 tracking-tight">{title}</h2>
      </div>

      <nav className="flex-1 p-3.5 space-y-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-blue-900/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-[#17233A]'
                }`
              }
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 bg-[#0B1020]/60">
        <div className="text-xs text-slate-400">
          <p className="font-semibold text-slate-200">NexPathra Platform</p>
          <p className="text-[11px] mt-0.5 text-slate-400">Where Skills Meet Opportunity</p>
        </div>
      </div>
    </aside>
  );
}
