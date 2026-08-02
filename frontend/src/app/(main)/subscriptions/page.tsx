"use client";

import React from "react";
import { Card, Badge, Button } from "@/src/components/ui";
import { CreditCard, CalendarClock, CircleDollarSign, CheckCircle2 } from "lucide-react";

const subscriptions = [
  {
    company: "Apex Realty",
    plan: "Growth",
    status: "ACTIVE",
    renewalDate: "2026-08-19",
    amount: "₹24,000",
  },
  {
    company: "Northstar Homes",
    plan: "Enterprise",
    status: "ACTIVE",
    renewalDate: "2026-08-05",
    amount: "₹62,000",
  },
  {
    company: "Metro Nest",
    plan: "Starter",
    status: "PAST_DUE",
    renewalDate: "2026-07-28",
    amount: "₹12,000",
  },
  {
    company: "Prime Square",
    plan: "Growth",
    status: "TRIAL",
    renewalDate: "2026-08-12",
    amount: "₹24,000",
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dummy subscription records for company billing and renewal tracking.
          </p>
        </div>
        <Button>Add Subscription</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active</p>
              <p className="text-2xl font-semibold text-slate-900">2</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Expiring Soon</p>
              <p className="text-2xl font-semibold text-slate-900">2</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Monthly MRR</p>
              <p className="text-2xl font-semibold text-slate-900">₹1,22,000</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Subscription list
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Placeholder subscription table for now.
            </p>
          </div>
          <Badge variant="secondary">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Demo data
          </Badge>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="grid grid-cols-5 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Company</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Renewal</span>
            <span className="text-right">Amount</span>
          </div>
          {subscriptions.map((item) => (
            <div
              key={item.company}
              className="grid grid-cols-5 border-t border-slate-100 bg-white px-4 py-4 text-sm"
            >
              <span className="font-medium text-slate-900">{item.company}</span>
              <span className="text-slate-600">{item.plan}</span>
              <span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.status === "TRIAL"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {item.status}
                </span>
              </span>
              <span className="text-slate-600">{item.renewalDate}</span>
              <span className="text-right font-medium text-slate-900">
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
