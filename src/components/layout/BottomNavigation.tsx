import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MapPin, RefreshCw, Settings } from 'lucide-react';

export function BottomNavigation() {
  return (
    <nav className="h-16 bg-white border-t border-gray-200 flex items-center justify-around shrink-0 pb-safe">
      <NavItem to="/dashboard" icon={<Home size={24} />} label="Home" />
      <NavItem to="/tracking" icon={<MapPin size={24} />} label="Tracking" />
      <NavItem to="/sync" icon={<RefreshCw size={24} />} label="Sync" />
      <NavItem to="/settings" icon={<Settings size={24} />} label="Settings" />
    </nav>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </NavLink>
  );
}
