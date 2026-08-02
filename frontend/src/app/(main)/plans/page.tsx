"use client";

import React from "react";
import { Card, Button, Badge } from "@/src/components/ui";
import { Layers3, PencilLine, Plus } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "₹12,000",
    interval: "/month",
    companies: 9,
    features: ["Basic CRM access", "1 admin user", "Email support"],
    status: "Popular",
  },
  {
    name: "Growth",
    price: "₹24,000",
    interval: "/month",
    companies: 11,
    features: ["Multi-user access", "Reporting", "Priority support"],
    status: "Active",
  },
  {
    name: "Enterprise",
    price: "₹62,000",
    interval: "/month",
    companies: 4,
    features: ["Custom workflows", "Dedicated success manager", "SLA support"],
    status: "Premium",
  },
];

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Manage Plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dummy plan catalog for pricing and package management.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} padding="lg" className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-slate-100" />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {plan.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Used by {plan.companies} companies
                  </p>
                </div>
                <Badge variant="secondary">{plan.status}</Badge>
              </div>

              <div>
                <span className="text-3xl font-semibold text-slate-900">
                  {plan.price}
                </span>
                <span className="ml-1 text-sm text-slate-500">
                  {plan.interval}
                </span>
              </div>

              <ul className="space-y-2 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-slate-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1">
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button className="flex-1">Assign</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
