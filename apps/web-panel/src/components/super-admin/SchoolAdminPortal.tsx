'use client';

import { useState } from 'react';
import { SchoolAdminDashboardView } from './SchoolAdminDashboardView';
import { ExamsListContent } from '../../app/school-admin/exams/PageContent';
import { TeachersListContent } from '../../app/school-admin/teachers/PageContent';
import { ResultsListContent } from '../../app/school-admin/results/PageContent';
import { StudentsListContent } from '../../app/school-admin/students/PageContent';
import { LayoutDashboard, FileText, GraduationCap, Trophy, Users, ChevronRight } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'exams', label: 'Exams', icon: FileText },
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'results', label: 'Results', icon: Trophy },
];

export function SchoolAdminPortal({ schoolId, schoolName }: { schoolId: string, schoolName: string }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SchoolAdminDashboardView schoolId={schoolId} />;
      case 'exams':
        return <ExamsListContent schoolIdProp={schoolId} />;
      case 'teachers':
        return <TeachersListContent schoolIdProp={schoolId} />;
      case 'students':
        return <StudentsListContent schoolIdProp={schoolId} />;
      case 'results':
        return <ResultsListContent schoolIdProp={schoolId} />;
      default:
        return <SchoolAdminDashboardView schoolId={schoolId} />;
    }
  };

  return (
    <div className="flex border border-border bg-surface rounded-2xl overflow-hidden shadow-sm min-h-[600px]">
      {/* Embedded School Admin Sidebar */}
      <aside className="w-56 bg-surface-hover/30 border-r border-border p-4 flex flex-col shrink-0">
        <div className="mb-6 px-2 py-1.5 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#008080]/15 flex items-center justify-center text-[#008080] font-bold text-xs">
              {schoolName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="text-[12px] font-bold text-text-main truncate uppercase tracking-wider">{schoolName}</h4>
              <p className="text-[9px] text-[#008080] font-semibold uppercase tracking-wider mt-0.5">School Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${
                  isActive
                    ? 'bg-[#008080] text-white shadow-md shadow-[#008080]/20'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-hover bg-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-80" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Embedded View Content */}
      <main className="flex-1 p-6 overflow-y-auto bg-surface">
        {renderActiveView()}
      </main>
    </div>
  );
}
