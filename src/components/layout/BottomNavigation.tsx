import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MapPin, RefreshCw, Settings, ShieldAlert, CalendarClock } from 'lucide-react';
import { UserContextEngine } from '@/modules/user-context';

export function BottomNavigation() {
  const role = UserContextEngine.role();
  const isSupervisor = role === 'MANAGER' || role === 'ADMIN';

  return (
    <nav className="h-16 bg-white border-t border-gray-200 flex items-center justify-around shrink-0 pb-safe w-full">
      <NavItem to="/dashboard" icon={<Home size={22} />} label="Home" />
      <NavItem to="/attendance" icon={<CalendarClock size={22} />} label="Time" />
      <NavItem to="/tracking" icon={<MapPin size={22} />} label="Map" />
      <NavItem to="/sync" icon={<RefreshCw size={22} />} label="Sync" />
      {isSupervisor && (
         <NavItem to="/supervisor" icon={<ShieldAlert size={22} />} label="Admin" />
      )}
      <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" />
    </nav>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
