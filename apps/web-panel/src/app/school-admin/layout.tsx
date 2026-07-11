'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import Link from 'next/link';
import { LayoutDashboard, FileText, Users, GraduationCap, LogOut, Menu, AlertCircle, User, MessageSquare, BookOpen, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

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
    label: 'Manage Batches',
    href: '/students',
    icon: <Layers className="w-5 h-5" />,
  },
  {
    label: 'Results',
    href: '/results',
    icon: <FileText className="w-5 h-5" />,
  }
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
  const [schoolName, setSchoolName] = useState<string>('');
  const [breadcrumbNames, setBreadcrumbNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchBreadcrumbName = async () => {
      const segments = pathname?.split('/').filter(Boolean) || [];
      const lastSegment = segments[segments.length - 1];
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
      
      if (isUUID && !breadcrumbNames[lastSegment]) {
         const type = segments[segments.length - 2];
         const supabase = createClient();
         
         if (type === 'exams') {
            const { data } = await supabase.from('exams').select('title').eq('id', lastSegment).single();
            if (data?.title) setBreadcrumbNames(prev => ({...prev, [lastSegment]: data.title}));
         } else if (type === 'teachers') {
            const { data } = await supabase.from('teachers').select('full_name').eq('id', lastSegment).single();
            if (data?.full_name) setBreadcrumbNames(prev => ({...prev, [lastSegment]: data.full_name}));
         } else if (type === 'students') {
            const { data } = await supabase.from('students').select('full_name').eq('id', lastSegment).single();
            if (data?.full_name) setBreadcrumbNames(prev => ({...prev, [lastSegment]: data.full_name}));
         }
      }
    };
    fetchBreadcrumbName();
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setRole(user.user_metadata?.role || 'school_admin');
        const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();
        const schoolId = profile?.school_id || user.user_metadata?.school_id || user.user_metadata?.schoolId;
        if (schoolId) {
          const { data: school } = await supabase.from('schools').select('name').eq('id', schoolId).single();
          if (school) setSchoolName(school.name);
        }
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

  const getBreadcrumbs = () => {
    const segments = pathname?.split('/').filter(Boolean) || [];
    const crumbs = [];

    // The root is always Dashboard
    if (segments[0] === 'school-admin' || segments.length === 0 || (segments.length === 1 && segments[0] !== 'exams' && segments[0] !== 'teachers' && segments[0] !== 'students' && segments[0] !== 'results')) {
      crumbs.push({ label: 'Dashboard', href: '/' });
    } else {
      crumbs.push({ label: 'Dashboard', href: '/' });
    }

    if (segments.includes('exams')) {
      crumbs.push({ label: 'Exams', href: '/exams' });
    } else if (segments.includes('teachers')) {
      crumbs.push({ label: 'Teachers', href: '/teachers' });
    } else if (segments.includes('students')) {
      crumbs.push({ label: 'Students', href: '/students' });
    } else if (segments.includes('results')) {
      crumbs.push({ label: 'Results', href: '/results' });
    }

    const lastSegment = segments[segments.length - 1];
    
    // Add additional segments if it's a detail page
    if (lastSegment && !['exams', 'teachers', 'students', 'results', 'school-admin'].includes(lastSegment)) {
      if (lastSegment === 'new') {
         crumbs.push({ label: 'New', href: null });
      } else {
         crumbs.push({ label: breadcrumbNames[lastSegment] || lastSegment, href: null });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f5f9f9]">
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 h-[100dvh] bg-[#1a2e2e] border-r border-[#243f3f] transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-16'}`}>
        
        {/* Desktop Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute -right-3 top-5 w-6 h-6 bg-[#243f3f] rounded-full items-center justify-center text-[#8ab8b8] hover:text-white hover:bg-[#325252] transition-colors border border-[#1a2e2e] z-50 shadow-sm cursor-pointer"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
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
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-[#8ab8b8] hover:text-[#008080] hover:bg-[#e0f2f2] rounded-lg p-2 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center text-[12px] md:text-[13px] font-medium text-text-main overflow-hidden">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={index} className={`items-center ${isLast ? 'flex' : 'hidden md:inline-flex'}`}>
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-[#008080] text-[#555555] transition-colors font-normal whitespace-nowrap">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-[#1a2e2e] font-bold whitespace-nowrap">{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && <span className="text-[#b2d8d8] mx-2">/</span>}
                  </span>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            {schoolName && (
              <span className="text-sm font-medium text-[#555555] hidden sm:block truncate max-w-[200px]" title={schoolName}>
                {schoolName}
              </span>
            )}
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
