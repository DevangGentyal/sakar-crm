"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  BadgeCheck,
  Gauge,
  CalendarClock,
  Users,
  Target,
  CheckCircle,
  XCircle,
  PhoneCall,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card } from "@/src/components/ui";
import { StatCard } from "@/src/components/dashboard/StatCard";
import { RecentLeadsCard } from "@/src/components/dashboard/RecentLeadsCard";
import { useCompanies } from "@/src/hooks/useAdmin";
import { useCurrentUser, useDashboardStats, useRecentLeads } from "@/src/hooks";
import { Company } from "@/src/types";
import { getStatusLabel, getSourceLabel } from "@/src/utils/helpers";

const subscriptionStats = {
  activeSubscriptions: 18,
  trialSubscriptions: 3,
  expiringIn7Days: 2,
  overduePayments: 1,
};

const planBreakdown = [
  { name: "Starter", companies: 9 },
  { name: "Growth", companies: 11 },
  { name: "Enterprise", companies: 4 },
];

function SuperAdminDashboard() {
  const router = useRouter();
  const { data: companies = [], isLoading } = useCompanies();

  const companyStats = companies.reduce(
    (acc, company) => {
      acc.totalCompanies += 1;
      if (company.status === "ACTIVE") acc.activeCompanies += 1;
      else acc.inactiveCompanies += 1;
      return acc;
    },
    {
      totalCompanies: 0,
      activeCompanies: 0,
      inactiveCompanies: 0,
      companiesAddedThisMonth: 0,
    },
  );

  const recentCompanies = [...(companies as Company[])]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Super Admin dashboard
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Company and subscription overview
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              This dashboard focuses only on tenant companies, plan usage, and
              subscription health. No lead or sales operations are shown here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/companies")}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Open companies
            </button>
            <button
              onClick={() => router.push("/subscriptions")}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View subscriptions
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total Companies"
          value={isLoading ? "—" : companyStats.totalCompanies}
          color="blue"
          onClick={() => router.push("/companies")}
        />
        <StatCard
          icon={BadgeCheck}
          label="Active Companies"
          value={isLoading ? "—" : companyStats.activeCompanies}
          color="green"
          onClick={() => router.push("/companies")}
        />
        <StatCard
          icon={CreditCard}
          label="Active Subs"
          value={subscriptionStats.activeSubscriptions}
          color="purple"
          onClick={() => router.push("/subscriptions")}
        />
        <StatCard
          icon={CalendarClock}
          label="Expiring Soon"
          value={subscriptionStats.expiringIn7Days}
          color="amber"
          onClick={() => router.push("/subscriptions")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card padding="lg" className="min-h-[320px]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Subscription health
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Mocked metrics for plan usage and billing state.
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Gauge className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Trial subscriptions",
                value: subscriptionStats.trialSubscriptions,
              },
              {
                label: "Expiring in 7 days",
                value: subscriptionStats.expiringIn7Days,
              },
              {
                label: "Overdue payments",
                value: subscriptionStats.overduePayments,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    {item.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="min-h-[320px]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Plan distribution
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Dummy plan mix across tenant companies.
              </p>
            </div>
            <button
              onClick={() => router.push("/plans")}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Manage Plans
            </button>
          </div>

          <div className="space-y-4">
            {planBreakdown.map((plan) => (
              <div key={plan.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {plan.name}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {plan.companies} companies
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{ width: `${Math.max(plan.companies * 8, 12)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Recent companies
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Live company records from the backend.
            </p>
          </div>
          <button
            onClick={() => router.push("/companies")}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            View all
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {recentCompanies.map((company) => (
            <div
              key={company.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {company.company_name}
                  </p>
                  <p className="mt-1 text-xs font-mono text-slate-500">
                    {company.company_code}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    company.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {company.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Updated: {new Date(company.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {!isLoading && recentCompanies.length === 0 && (
            <p className="text-sm text-slate-400">No companies created yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function StandardDashboard() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentLeads, isLoading: leadsLoading } = useRecentLeads(5);

  const statusMap = Object.fromEntries(
    (stats?.statusBreakdown ?? []).map((s) => [s.status, s.count]),
  );
  const totalLeads = stats?.totalLeads ?? 0;
  const newLeads = statusMap["NEW"] ?? 0;
  const bookedLeads = statusMap["BOOKED"] ?? 0;
  const lostLeads = statusMap["LOST"] ?? 0;
  const followupLeads = statusMap["FOLLOW_UP"] ?? 0;
  const conversionRate =
    totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of your CRM activity
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={statsLoading ? "—" : totalLeads}
          color="blue"
          onClick={() => router.push("/leads")}
        />
        <StatCard
          icon={Target}
          label="New"
          value={statsLoading ? "—" : newLeads}
          color="purple"
          onClick={() => router.push("/leads?status=NEW")}
        />
        <StatCard
          icon={PhoneCall}
          label="Follow-ups"
          value={statsLoading ? "—" : followupLeads}
          color="amber"
          onClick={() => router.push("/leads?status=FOLLOW_UP")}
        />
        <StatCard
          icon={CheckCircle}
          label="Booked"
          value={statsLoading ? "—" : bookedLeads}
          color="green"
          onClick={() => router.push("/leads?status=BOOKED")}
        />
        <StatCard
          icon={XCircle}
          label="Lost"
          value={statsLoading ? "—" : lostLeads}
          color="red"
          onClick={() => router.push("/leads?status=LOST")}
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion"
          value={statsLoading ? "—" : `${conversionRate}%`}
          color="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg" className="min-h-[280px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Leads by Status
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Current pipeline distribution
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-4">
            {(stats?.statusBreakdown ?? []).map((item) => (
              <div
                key={item.status}
                className="grid grid-cols-[112px_1fr_32px] items-center gap-3"
              >
                <span className="text-sm font-medium text-slate-600 truncate">
                  {getStatusLabel(item.status as any)}
                </span>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{
                      width: `${Math.max((item.count / totalLeads) * 100, 8)}%`,
                    }}
                  />
                </div>
                <span className="text-right text-sm font-bold text-slate-800">
                  {item.count}
                </span>
              </div>
            ))}
            {(stats?.statusBreakdown ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No data yet</p>
            )}
          </div>
        </Card>

        <Card padding="lg" className="min-h-[280px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Leads by Source
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Where your enquiries come from
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-4">
            {(stats?.sourceBreakdown ?? []).map((item) => (
              <div
                key={item.source}
                className="grid grid-cols-[112px_1fr_32px] items-center gap-3"
              >
                <span className="text-sm font-medium text-slate-600 truncate">
                  {getSourceLabel(item.source as any)}
                </span>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.max((item.count / totalLeads) * 100, 8)}%`,
                    }}
                  />
                </div>
                <span className="text-right text-sm font-bold text-slate-800">
                  {item.count}
                </span>
              </div>
            ))}
            {(stats?.sourceBreakdown ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No data yet</p>
            )}
          </div>
        </Card>
      </div>

      <RecentLeadsCard leads={recentLeads} isLoading={leadsLoading} />
    </div>
  );
}

export default function Dashboard() {
  const { data: user, isLoading } = useCurrentUser({ enabled: true });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }

  return <StandardDashboard />;
}
