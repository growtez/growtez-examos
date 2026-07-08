'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Menu, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/super-admin') return 'Dashboard';
    if (pathname?.startsWith('/schools') || pathname?.startsWith('/super-admin/schools')) return 'Schools';
    return 'Command Center';
  };

  const title = getPageTitle();

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-[52px]' : 'md:ml-[180px]'}`}>
        <header className="sticky top-0 z-30 h-14 md:h-14 flex items-center border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile hamburger */}
              <button 
                className="md:hidden p-2 rounded-lg bg-surface-hover text-text-muted hover:text-text-main hover:bg-border transition-colors" 
                onClick={() => setMobileSidebarOpen(true)} 
                title="Open menu"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center">
                <span className="text-[12px] md:text-[13px] font-medium text-text-main">{title}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="relative group">
                <button
                  id="header-admin-menu-trigger"
                  className="w-9 h-9 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center font-bold text-sm border border-accent-primary/15 hover:bg-accent-primary/20 transition-colors"
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  title="Admin menu"
                >
                  SA
                </button>
                <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all z-50">
                  <div id="header-admin-menu" className="w-48 rounded-xl border border-border bg-surface shadow-xl p-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] text-text-main font-semibold truncate block w-full">Super Admin</span>
                    </div>
                    <button
                      className="mt-3 flex items-center gap-2 px-2.5 py-2 w-full bg-transparent border-none rounded-lg text-text-muted text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 animate-fade-in relative z-10">
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-3 pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
