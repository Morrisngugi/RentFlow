'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getLogoUrl, getProfileImageUrl } from '@/lib/api';
import { User } from '@/lib/types';
import { getMenuForRole, getDashboardTitleForRole, MenuItem } from '@/lib/navigationConfig';
import dynamic from 'next/dynamic';

const NotificationBell = dynamic(() => import('@/components/NotificationBell'), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = getMenuForRole(user?.role);

  // Handle click outside for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const dropdownMenu = document.getElementById('user-dropdown-menu');
        if (dropdownMenu && !dropdownMenu.contains(event.target as Node)) {
          setShowUserMenu(false);
        }
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu or sidebar is open
  useEffect(() => {
    if (showUserMenu || sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showUserMenu, sidebarOpen]);

  // Check authentication and fetch user profile
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      
      // Fetch latest profile data from server
      const fetchLatestProfile = async () => {
        try {
          const latestProfile = await apiClient.getProfile();
          setUser(latestProfile as User);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching profile:', error);
          // If profile fetch fails, still allow access with cached user data
          setUser(userData as User);
          setLoading(false);
        }
      };
      
      fetchLatestProfile();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
      return;
    }
  }, [router]);

  const handleLogout = () => {
    setShowUserMenu(false);
    apiClient.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar - Three Pane Architecture */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white flex-col z-40 shadow-lg border-r-2 border-gray-200">
        {/* Sidebar Header with Logo - Branding Anchor */}
        <div className="p-6 border-b-2 border-gray-200 h-[88px] flex items-center bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">RentFlow</p>
              <p className="text-xs text-gray-600 font-medium">{getDashboardTitleForRole(user?.role)}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Primary Links */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-0.5">
          {menuItems.map((item: MenuItem) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 font-semibold border-l-4 border-blue-600 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                }`}
              >
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r-2 border-gray-200 flex flex-col z-60 animate-slide-in shadow-2xl">
            {/* Sidebar Header */}
            <div className="p-6 border-b-2 border-gray-200 h-[88px] flex items-center bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">RentFlow</p>
                  <p className="text-xs text-gray-500">{getDashboardTitleForRole(user?.role)}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 overflow-y-auto space-y-0.5">
              {menuItems.map((item: MenuItem) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 font-semibold border-l-4 border-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="text-xl mr-3 group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content - Central Work Area */}
      <main className="md:ml-64 min-h-screen">
        {/* Top Navigation Bar - Slim Persistent Bar */}
        <div className="fixed top-0 right-0 md:left-64 left-0 z-[90] h-[56px] md:h-[88px] flex items-center bg-white shadow-md">
          {/* Nav Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50"></div>
          <div className="absolute inset-0 backdrop-blur-sm bg-white/95"></div>

          {/* Nav Content */}
          <div className="relative h-full px-4 md:px-8 border-b-2 border-gray-200 flex items-center w-full">
            {/* Hamburger for mobile */}
            <button
              className="md:hidden flex items-center justify-center mr-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none z-[91]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Notification Bell and User Menu */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              {user?.role && <NotificationBell userRole={user.role} />}

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 hover:bg-white/80 rounded-lg px-3 py-2 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-md relative z-[91]"
                >
                  {user?.profileImageUrl ? (
                    <img
                      src={getProfileImageUrl(user.profileImageUrl) || ''}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover shadow-md ring-2 ring-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white text-sm">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500 capitalize font-medium">{user?.role}</div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Dropdown Menu */}
        {showUserMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              onClick={() => setShowUserMenu(false)}
            />
            <div
              id="user-dropdown-menu"
              className="fixed right-4 md:right-8 top-[56px] md:top-[88px] w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[110]"
            >
              {/* Dropdown Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-600 mt-1">{user?.email}</div>
                <div className="mt-2 inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-full">
                  {user?.role}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
                type="button"
                className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 font-medium cursor-pointer border-t border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </>
        )}

        {/* Page Content - Main Work Area with Ample Whitespace */}
        <div className="pt-[56px] md:pt-[88px] p-6 md:p-10 min-h-screen">{children}</div>
      </main>

      {/* Add slide-in animation for sidebar */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
