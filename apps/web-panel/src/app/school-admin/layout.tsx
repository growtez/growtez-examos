'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import Link from 'next/link';
import { LayoutDashboard, FileText, Users, GraduationCap, LogOut, Menu, AlertCircle, User, MessageSquare, BookOpen } from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Exams',
    href: '/exams',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Teachers',
    href: '/teachers',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Students',
    href: '/students',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    label: 'Results',
    href: '/results',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Billing & Credits',
    href: '/school-admin/billing',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
];

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<string>('school_admin');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setRole(user.user_metadata?.role || 'school_admin');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/school-admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f5f9f9]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#1a2e2e] border-r border-[#243f3f] transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="h-16 flex items-center px-4 border-b border-[#243f3f] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white flex items-center justify-center flex-shrink-0 rounded-lg shadow-sm">
              <img src="/logo.png" alt="Growtez Logo" className="w-7 h-7 object-contain" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#4da6a6] font-extrabold text-lg tracking-wide leading-tight truncate drop-shadow-sm" title="ParikshaOS">
                  ParikshaOS
                </h1>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.filter(item => {
            if (role === 'teacher') {
              return ['Dashboard', 'Exams', 'Results'].includes(item.label);
            }
            return true;
          }).map((item) => {
            const activeClass = "bg-[#008080]/15 text-white rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]";
            const inactiveClass = "text-[#8ab8b8] hover:bg-[#243f3f]/50 hover:text-white rounded-xl transparent";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-200 group ${
                  isActive(item.href) ? activeClass : inactiveClass
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive(item.href) ? 'text-[#00c8c8]' : 'text-[#8ab8b8] group-hover:text-white group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                {sidebarOpen && item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#243f3f]">
          <button
            onClick={() => setShowSignoutConfirm(true)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[#8ab8b8] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-xl transition-all duration-200 w-full group"
          >
            <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            {sidebarOpen && 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#e0f2f2] flex items-center justify-between px-6 shadow-sm sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#8ab8b8] hover:text-[#008080] hover:bg-[#e0f2f2] rounded-lg p-2 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-9 h-9 bg-gradient-to-br from-[#008080] to-[#005555] rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              >
                <User className="text-white w-5 h-5" />
              </div>
              
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e0f2f2] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm font-medium text-[#555555] hover:bg-[#f5f9f9] hover:text-[#008080] transition-colors">
                      <User className="w-4 h-4 mr-3 text-[#8ab8b8]" />
                      Profile & Subscriptions
                    </Link>
                    <Link href="/instructions" onClick={() => setProfileDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm font-medium text-[#555555] hover:bg-[#f5f9f9] hover:text-[#008080] transition-colors">
                      <BookOpen className="w-4 h-4 mr-3 text-[#8ab8b8]" />
                      Exam Instructions
                    </Link>
                    <Link href="/feedback" onClick={() => setProfileDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm font-medium text-[#555555] hover:bg-[#f5f9f9] hover:text-[#008080] transition-colors">
                      <MessageSquare className="w-4 h-4 mr-3 text-[#8ab8b8]" />
                      Feedback
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2e2e] mb-2">Sign Out</h3>
              <p className="text-[#555555] text-sm font-medium mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSignoutConfirm(false)}
                  className="flex-1 py-3 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-red-500/20"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
