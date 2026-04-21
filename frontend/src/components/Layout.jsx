import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon, CloudArrowUpIcon, DocumentMagnifyingGlassIcon,
  UsersIcon, ChartBarIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, BellIcon, DocumentCheckIcon, ShieldCheckIcon,
  SunIcon, MoonIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useAuthStore, useThemeStore } from '../store/authStore';
import toast from 'react-hot-toast';

const navByRole = {
  admin: [
    { label: 'Dashboard', icon: HomeIcon, href: '/admin' },
    { label: 'GSTR2B Upload', icon: CloudArrowUpIcon, href: '/admin' },
    { label: 'Manage Users', icon: UsersIcon, href: '/admin' },
    { label: 'My Profile', icon: UserCircleIcon, href: '/profile' }
  ],
  client: [
    { label: 'Dashboard', icon: HomeIcon, href: '/client' },
    { label: 'Upload Data', icon: CloudArrowUpIcon, href: '/client' },
    { label: 'Reconciliation', icon: DocumentMagnifyingGlassIcon, href: '/client' },
    { label: 'My Profile', icon: UserCircleIcon, href: '/profile' }
  ],
  officer: [
    { label: 'Dashboard', icon: HomeIcon, href: '/officer' },
    { label: 'Matches', icon: DocumentCheckIcon, href: '/officer' },
    { label: 'All History', icon: ChartBarIcon, href: '/officer' },
    { label: 'My Profile', icon: UserCircleIcon, href: '/profile' }
  ]
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = navByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
            G
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white leading-tight">GSTPro</h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Reconciliation System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-500'}`} />
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold uppercase">
              {user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-semibold shadow-sm hover:shadow-md"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {location.pathname === '/admin' ? 'Admin Dashboard' : 
                 location.pathname === '/client' ? 'Client Dashboard' :
                 location.pathname === '/officer' ? 'Officer Dashboard' : 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-500">Welcome back, {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* Theme Toggle Button */}
             <button 
               onClick={toggleTheme}
               className="btn-icon group"
               title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
               {isDark ? (
                 <SunIcon className="w-6 h-6 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
               ) : (
                 <MoonIcon className="w-6 h-6 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
               )}
             </button>

             <button className="btn-icon">
               <BellIcon className="w-6 h-6" />
             </button>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

             <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:border-brand-500/50 shadow-sm">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{user?.role}</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-brand-500/10 to-transparent pointer-events-none" />
          <div className="p-6 sm:p-8 max-w-7xl mx-auto relative z-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
