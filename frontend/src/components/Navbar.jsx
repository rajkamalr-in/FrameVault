import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Shield, Users } from 'lucide-react';
import TrizenLogo from './TrizenLogo';
import { authService } from '../services/authService';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/">
          <TrizenLogo className="w-8 h-8 sm:w-9 sm:h-9" />
        </Link>

        {user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
              {user.role === 'ADMIN' ? (
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Users className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                {user.role === 'ADMIN' ? 'Lead Admin' : 'Team Member'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-700">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span>{user.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
