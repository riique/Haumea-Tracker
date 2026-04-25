import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { LogOut, LayoutDashboard, History, Trophy, User } from 'lucide-react';
import clsx from 'clsx';
import ProfileModal from './ProfileModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = () => auth.signOut();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'Histórico', icon: History },
    { path: '/scoreboard', label: 'Scoreboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-border h-screen sticky top-0 p-6 justify-between">
        <div>
          <div className="mb-12">
            <h1 className="font-display font-bold text-2xl tracking-tight text-textMain">
              Haumea<span className="text-accent">.</span>
            </h1>
            <p className="text-textMuted text-xs font-mono mt-1 tracking-wider uppercase">Performance Tracker</p>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-white text-textMain border border-border shadow-sm" 
                      : "text-textMuted hover:bg-white/50 hover:text-textMain"
                  )}
                >
                  <item.icon 
                    size={18} 
                    className={clsx(
                      "transition-colors",
                      isActive ? "text-accent" : "text-textMuted group-hover:text-textMain"
                    )} 
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1">
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-textMuted hover:text-textMain hover:bg-white/50 rounded-lg transition-colors"
          >
            <User size={18} />
            Editar Perfil
          </button>
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-textMuted hover:text-accent hover:bg-white/50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-sidebar border-b border-border sticky top-0 z-20">
        <h1 className="font-display font-bold text-xl tracking-tight">
          Haumea<span className="text-accent">.</span>
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsProfileOpen(true)} className="text-textMuted hover:text-textMain">
            <User size={20} />
          </button>
          <button onClick={handleSignOut} className="text-textMuted hover:text-accent">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 lg:p-12 overflow-y-auto pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-border h-20 pb-safe flex items-center justify-around z-30 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full gap-1",
                isActive ? "text-accent" : "text-textMuted"
              )}
            >
              <div className={clsx(
                "p-2 rounded-lg transition-all",
                isActive ? "bg-white border border-border shadow-sm" : ""
              )}>
                <item.icon size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
};

export default Layout;
