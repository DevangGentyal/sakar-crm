'use client';

import React, { ReactNode } from 'react';
import { LogOut, User } from 'lucide-react';
import { AuthUser } from '@/src/types';
import { getInitials } from '@/src/utils/helpers';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user?: AuthUser;
  onLogout?: () => void;
  children?: ReactNode;
}

export const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>(
  ({ user, onLogout, children }, ref) => {
    const [showDropdown, setShowDropdown] = React.useState(false);

    return (
      <div
        ref={ref}
        className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20"
      >
        <div className="flex items-center justify-between h-full px-6 ml-20 md:ml-64">
          {/* Left Content */}
          <div className="flex-1">{children}</div>

          {/* Right Content - User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
                  {getInitials(user.name)}
                </div>
                <span className="text-sm font-medium text-slate-900 hidden sm:inline">
                  {user.name}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{user.email}</p>
                    </div>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-slate-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Navbar.displayName = 'Navbar';
