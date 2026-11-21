"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handshake, Menu, X } from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  items: NavItem[];
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ items }, ref) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
      const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile) {
          setIsOpen(true);
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
      setIsOpen(!isOpen);
    };

    return (
      <>
        {/* Mobile Toggle Button */}
        <div className="fixed top-4 left-4 z-40 md:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <div
          ref={ref}
          className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-30 ${
            isOpen ? "w-64" : "w-20"
          } ${isMobile && !isOpen ? "-translate-x-full" : ""}`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <Handshake className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            {isOpen && (
              <h1 className="font-semibold text-slate-900">KARYAA CRM</h1>
            )}
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-2">
            {items.map((item) => {
              const isActive =
                item.active !== undefined
                  ? item.active
                  : item.href && pathname === item.href;

              const content = (
                <>
                  {item.icon}
                  {isOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </>
              );

              const className = `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`;

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={className}
                    title={!isOpen ? item.label : ""}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={className}
                  title={!isOpen ? item.label : ""}
                >
                  {content}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
        </div>

        {/* Mobile Backdrop */}
        {isMobile && isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
);

Sidebar.displayName = "Sidebar";
