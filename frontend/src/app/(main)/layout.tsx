"use client";

import React from "react";
import {
  Home,
  Users,
  Building2,
  CreditCard,
  SlidersHorizontal,
  Plug,
} from "lucide-react";
import { Sidebar, Navbar } from "@/src/components/layout";
import { useCurrentUser, useLogout } from "@/src/hooks";
import { usePathname, useRouter } from "next/navigation";
import { getAuthToken } from "@/src/services/client";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasStoredSession] = React.useState(() => Boolean(getAuthToken()));
  const {
    data: user,
    isLoading: userLoading,
    isError,
  } = useCurrentUser({ enabled: hasStoredSession });
  const logoutMutation = useLogout();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!hasStoredSession || isError) {
      router.replace("/login");
    }
  }, [hasStoredSession, isError, router]);

  React.useEffect(() => {
    if (user?.role === "SUPER_ADMIN" && pathname.startsWith("/leads")) {
      router.replace("/dashboard");
    }
  }, [pathname, router, user?.role]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
  ];

  if (user?.role === "ADMIN" || user?.role === "EXECUTIVE") {
    navItems.push({
      label: "Leads",
      href: "/leads",
      icon: <Users className="w-5 h-5" />,
    });
  }

  if (user?.role === "ADMIN") {
    navItems.push({
      label: "Executives",
      href: "/executives",
      icon: <SlidersHorizontal className="w-5 h-5" />,
    });
    navItems.push({
      label: "Meta Lead Ads",
      href: "/integrations/meta",
      icon: <Plug className="w-5 h-5" />,
    });
  }

  if (user?.role === "SUPER_ADMIN") {
    navItems.push({
      label: "Companies",
      href: "/companies",
      icon: <Building2 className="w-5 h-5" />,
    });
    navItems.push({
      label: "Subscriptions",
      href: "/subscriptions",
      icon: <CreditCard className="w-5 h-5" />,
    });
    navItems.push({
      label: "Manage Plans",
      href: "/plans",
      icon: <SlidersHorizontal className="w-5 h-5" />,
    });
    navItems.push({
      label: "Meta Integration",
      href: "/meta-integration",
      icon: <Plug className="w-5 h-5" />,
    });
  }

  if (userLoading || isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar items={navItems} />

      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Navbar user={user} onLogout={handleLogout} />

        <main className="flex-1 overflow-auto mt-16 bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
