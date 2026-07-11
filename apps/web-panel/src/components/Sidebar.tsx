'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    School,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Moon,
    Sun,
    LucideIcon,
    Users,
    FileText,
    CreditCard,
    Tag
} from 'lucide-react';

export interface NavItem {
    path?: string;
    icon: LucideIcon;
    label: string;
    subItems?: { path: string; label: string }[];
}

export const defaultNavItems: NavItem[] = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/schools', icon: School, label: 'Schools' },
    { path: '/exams', icon: FileText, label: 'Exams' },
    { path: '/plans', icon: Tag, label: 'Plans' },
    { path: '/subscriptions', icon: CreditCard, label: 'Transactions' },
];

const ICON_BOX = 20;
const ICON_SIZE = 18;

const NavItemComponent = ({ 
    item, 
    collapsed, 
    onMouseEnter, 
    onMouseLeave,
    onLinkClick
}: { 
    item: NavItem, 
    collapsed: boolean, 
    onMouseEnter: (e: any, label: string) => void,
    onMouseLeave: () => void,
    onLinkClick?: () => void
}) => {
    const pathname = usePathname();
    const isSubItemActive = item.subItems?.some(sub => pathname?.startsWith(sub.path));
    const [isOpen, setIsOpen] = useState(true);

    if (item.subItems) {
        return (
            <div className="nav-item-group">
                <button
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-[13px] font-medium rounded-lg mb-1 border transition-colors ${isSubItemActive ? 'bg-sidebar-hover text-sidebar-text border-transparent' : 'text-sidebar-text-muted bg-transparent border-transparent hover:bg-sidebar-hover hover:text-sidebar-text'}`}
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseEnter={(e) => onMouseEnter(e, item.label)}
                    onMouseLeave={onMouseLeave}
                >
                    <div className="flex items-center w-full h-5">
                        <div
                            className="flex items-center justify-center shrink-0 grow-0"
                            style={{ width: ICON_BOX, height: ICON_BOX }}
                        >
                            <item.icon size={ICON_SIZE} className="shrink-0" />
                        </div>
                        <div
                            className={`ml-2.5 h-full flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}
                        >
                            <span className="truncate">{item.label}</span>
                        </div>
                    </div>
                    {!collapsed && (
                        isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />
                    )}
                </button>
                {isOpen && !collapsed && (
                    <div className="flex flex-col pl-5 mt-0.5 ml-3 border-l border-sidebar-border">
                        {item.subItems.map((sub, idx) => {
                            const isActive = pathname === sub.path;
                            return (
                                <Link
                                    key={idx}
                                    href={sub.path}
                                    onClick={onLinkClick}
                                    className={`px-2.5 py-2 text-[12px] rounded transition-colors mb-0.5 block ${isActive ? 'text-sidebar-accent font-semibold bg-[#A0D9B4]/15' : 'text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover'}`}
                                >
                                    {sub.label}
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        );
    }

    const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path!));

    return (
        <Link
            href={item.path!}
            onClick={onLinkClick}
            className={`w-full flex items-center px-2.5 py-2 text-[13px] font-medium rounded-lg mb-1 border transition-colors ${isActive ? 'bg-sidebar-accent text-[#1A202C] border-sidebar-accent font-semibold' : 'text-sidebar-text-muted bg-transparent border-transparent hover:bg-sidebar-hover hover:text-sidebar-text'}`}
            onMouseEnter={(e) => onMouseEnter(e, item.label)}
            onMouseLeave={onMouseLeave}
        >
            <span
                className="flex items-center justify-center shrink-0 grow-0"
                style={{ width: ICON_BOX, height: ICON_BOX }}
            >
                <item.icon size={ICON_SIZE} className="shrink-0" />
            </span>
            <div
                className={`ml-2.5 h-full flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}
            >
                <span className="truncate">{item.label}</span>
            </div>
        </Link>
    );
};

export default function Sidebar({ 
    collapsed, 
    setCollapsed, 
    mobileOpen = false, 
    setMobileOpen,
    items
}: { 
    collapsed: boolean, 
    setCollapsed?: (val: boolean) => void,
    mobileOpen?: boolean,
    setMobileOpen?: (val: boolean) => void,
    items?: NavItem[]
}) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [tooltip, setTooltip] = useState<{label: string, top: number} | null>(null);

    const handleMouseEnter = (e: any, label: string) => {
        if (!(collapsed && !mobileOpen)) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            label,
            top: rect.top + rect.height / 2
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    useEffect(() => {
        if (localStorage.getItem('theme') === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = (event: any) => {
        const isDark = !isDarkMode;
        
        const updateTheme = () => {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                setIsDarkMode(true);
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                setIsDarkMode(false);
            }
        };

        if (!(document as any).startViewTransition) {
            updateTheme();
            return;
        }

        const x = event.clientX;
        const y = event.clientY;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = (document as any).startViewTransition(updateTheme);

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
            ];

            document.documentElement.animate(
                {
                    clipPath: clipPath,
                },
                {
                    duration: 500,
                    easing: 'ease-out',
                    pseudoElement: '::view-transition-new(root)',
                }
            );
        });
    };

    const effectiveCollapsed = collapsed && !mobileOpen;

    return (
        <aside
            className={`fixed top-0 left-0 h-screen flex flex-col bg-sidebar-bg border-r border-sidebar-border z-50 transition-[width] duration-150 ${effectiveCollapsed ? 'w-[52px]' : 'w-[180px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
            <div className="border-b border-sidebar-border py-4 pl-4 pr-4 flex items-center justify-between overflow-hidden">
                <div className="flex items-center overflow-hidden">
                    <div className="w-6 h-6 bg-sidebar-accent flex items-center justify-center rounded-sm shrink-0">
                        <span className="text-[#1A202C] font-extrabold text-xs">P</span>
                    </div>
                    <span
                        className={`text-lg ml-2 font-extrabold bg-gradient-to-br from-white to-sidebar-text-muted text-transparent bg-clip-text tracking-tight font-poppins leading-none overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${effectiveCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}
                    >
                        ParikshaOS
                    </span>
                </div>
                {setCollapsed && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`hidden md:flex items-center justify-center shrink-0 grow-0 text-sidebar-text-muted hover:text-sidebar-text transition-colors ${effectiveCollapsed ? 'absolute -right-3 top-4 bg-sidebar-bg border border-sidebar-border rounded-full w-6 h-6 z-50' : ''}`}
                        title={effectiveCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {effectiveCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={16} />}
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-1.5 mt-3">
                {(items || defaultNavItems).map((item, idx) => (
                    <NavItemComponent 
                        key={idx} 
                        item={item} 
                        collapsed={effectiveCollapsed} 
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onLinkClick={() => setMobileOpen && setMobileOpen(false)}
                    />
                ))}
            </nav>

            <div className="p-2 border-t border-sidebar-border mt-auto">
                <button
                    onClick={toggleDarkMode}
                    className={`w-full flex items-center px-2.5 py-2 text-[13px] font-medium rounded-lg border border-transparent transition-colors text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text`}
                    onMouseEnter={(e) => handleMouseEnter(e, isDarkMode ? 'Light Mode' : 'Dark Mode')}
                    onMouseLeave={handleMouseLeave}
                >
                    <span className="flex items-center justify-center shrink-0 grow-0" style={{ width: ICON_BOX, height: ICON_BOX }}>
                        {isDarkMode ? <Sun size={ICON_SIZE} /> : <Moon size={ICON_SIZE} />}
                    </span>
                    <div className={`ml-2.5 h-full flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${effectiveCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}>
                        <span className="truncate">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                </button>
            </div>

            {tooltip && (
                <div 
                    className="fixed left-[60px] z-[100] px-3.5 py-2 bg-sidebar-bg border border-sidebar-border text-sidebar-text text-[14px] font-medium rounded-md shadow-xl pointer-events-none transform -translate-y-1/2 whitespace-nowrap flex items-center"
                    style={{ top: tooltip.top }}
                >
                    <div className="absolute -left-[5px] w-2.5 h-2.5 bg-sidebar-bg border-l border-b border-sidebar-border transform rotate-45"></div>
                    <span className="relative z-10">{tooltip.label}</span>
                </div>
            )}

        </aside>
    );
}
