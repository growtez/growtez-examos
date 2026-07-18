'use client';

import { useState } from 'react';
import { SchoolAdminDashboardView } from './SchoolAdminDashboardView';
import { ExamsListContent } from '../../app/school-admin/exams/PageContent';
import { TeachersListContent } from '../../app/school-admin/teachers/PageContent';
import { ResultsListContent } from '../../app/school-admin/results/PageContent';
import { StudentsListContent } from '../../app/school-admin/students/PageContent';
import DeleteSchoolButton from '../../app/super-admin/schools/DeleteSchoolButton';
import { LayoutDashboard, FileText, GraduationCap, Trophy, Users, MessageSquare, Bell, Coins } from 'lucide-react';
import SchoolFeedbackContent from './SchoolFeedbackContent';
import SchoolNotificationsContent from './SchoolNotificationsContent';
import EditSchoolCredits from './EditSchoolCredits';

const menuItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'exams', label: 'Exams Management', icon: FileText },
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'results', label: 'Results & Reports', icon: Trophy },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function SchoolAdminPortal({ school, schoolAdmin }: { school: any; schoolAdmin: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const schoolId = school.id;

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
      case 'feedback':
        return <SchoolFeedbackContent schoolId={schoolId} />;
      case 'notifications':
        return <SchoolNotificationsContent schoolId={schoolId} schoolName={school.name} />;
      default:
        return <SchoolAdminDashboardView schoolId={schoolId} />;
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-0">
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
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-4 mb-6 border-b border-border/40 pb-6 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 shrink-0 shadow-sm">
                    <span className="text-lg font-bold text-accent-primary">
                        {school.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-text-main" data-page-title="school-name">{school.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-muted mt-1 font-medium">
                    <span>{school.domain || 'No domain set'}</span>
                    <span className="text-border/60 font-normal">•</span>
                    <span>Email: {school.contact_email || '—'}</span>
                    <span className="text-border/60 font-normal">•</span>
                    <span>Phone: {school.contact_phone || '—'}</span>
                    <span className="text-border/60 font-normal">•</span>
                    <span>Admin: {schoolAdmin?.full_name ? `${schoolAdmin.full_name} (${schoolAdmin.email})` : 'No admin assigned'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-surface hover:bg-surface-hover px-3 py-1.5 rounded-xl border border-border transition-colors">
                  <Coins size={14} className="text-accent-primary" />
                  <EditSchoolCredits schoolId={school.id} initialCredits={school.exam_credits} />
                </div>
                <div className="bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20 transition-colors">
                  <DeleteSchoolButton schoolId={school.id} />
                </div>
              </div>
            </div>
          </div>
        )}
        {renderActiveView()}
      </div>
    </div>
  );
}
