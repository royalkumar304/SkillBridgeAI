import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ title, roleLabel, items = [] }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="p-5 border-b border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
          {roleLabel}
        </span>
        <h2 className="text-base font-bold text-brand-900 mt-2">{title}</h2>
      </div>

      <nav className="flex-1 p-4 space-y-1">
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
                    ? 'bg-brand-900 text-white shadow-sm shadow-brand-900/20'
                    : 'text-slate-600 hover:text-brand-900 hover:bg-slate-100'
                }`
              }
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/70">
        <div className="text-xs text-slate-500">
          <p className="font-semibold text-slate-700">SkillBridge Platform</p>
          <p className="text-[11px] mt-0.5">SIH 2026 Microservices Live</p>
        </div>
      </div>
    </aside>
  );
}

