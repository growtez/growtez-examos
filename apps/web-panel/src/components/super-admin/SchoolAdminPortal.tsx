'use client';

import { useState } from 'react';
import { SchoolAdminDashboardView } from './SchoolAdminDashboardView';
import { ExamsListContent } from '../../app/school-admin/exams/PageContent';
import { TeachersListContent } from '../../app/school-admin/teachers/PageContent';
import { ResultsListContent } from '../../app/school-admin/results/PageContent';
import { StudentsListContent } from '../../app/school-admin/students/PageContent';
import { LayoutDashboard, FileText, GraduationCap, Trophy, Users } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'exams', label: 'Exams Management', icon: FileText },
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'results', label: 'Results & Reports', icon: Trophy },
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
    <div className="flex flex-col gap-4 mt-2">
      {/* Horizontal Tabs Native to Super Admin */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-px overflow-x-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap rounded-t-lg ${
                isActive
                  ? 'border-accent-primary text-accent-primary bg-accent-primary/10 shadow-[inset_0_-2px_0_rgba(var(--accent-primary),1)]'
                  : 'border-transparent text-text-muted hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Render Content seamlessly */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderActiveView()}
      </div>
    </div>
  );
}
