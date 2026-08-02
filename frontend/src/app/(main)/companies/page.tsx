"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  Building2,
  Power,
  PowerOff,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useActivateCompany,
  useCompanies,
  useCreateCompany,
  useDeactivateCompany,
} from "@/src/hooks/useAdmin";
import { Button, Card, Input, Badge } from "@/src/components/ui";
import { Company } from "@/src/types";

export default function CompaniesPage() {
  const { data: companies = [], isLoading } = useCompanies();
  const createMutation = useCreateCompany();
  const activateMutation = useActivateCompany();
  const deactivateMutation = useDeactivateCompany();

  const [form, setForm] = useState({
    companyName: "",
    companyCode: "",
    companyType: "",
    email: "",
    companyMobile: "",
    address: "",
    executiveRegistrationPassword: "",
    adminName: "",
    adminEmail: "",
    adminMobile: "",
    adminPassword: "",
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [
    showExecutiveRegistrationPassword,
    setShowExecutiveRegistrationPassword,
  ] = useState(false);

  const generateAdminPassword = () => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from(
      { length: 8 },
      () => charset[Math.floor(Math.random() * charset.length)],
    ).join("");
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      adminPassword: generateAdminPassword(),
      executiveRegistrationPassword: generateAdminPassword(),
    }));
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync({
      companyName: form.companyName,
      companyCode: form.companyCode,
      companyType: form.companyType,
      email: form.email,
      mobile: form.companyMobile || undefined,
      address: form.address || undefined,
      executiveRegistrationPassword:
        form.executiveRegistrationPassword || undefined,
      adminPassword: form.adminPassword,
      adminName: form.adminName,
      adminEmail: form.adminEmail,
      adminMobile: form.adminMobile || undefined,
    });
    const nextAdminPassword = generateAdminPassword();
    const nextExecutiveRegistrationPassword = generateAdminPassword();
    setForm({
      companyName: "",
      companyCode: "",
      companyType: "",
      email: "",
      companyMobile: "",
      address: "",
      executiveRegistrationPassword: nextExecutiveRegistrationPassword,
      adminName: "",
      adminEmail: "",
      adminMobile: "",
      adminPassword: nextAdminPassword,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Companies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Super Admin can create, activate, and deactivate tenant companies.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <Card padding="lg" className="bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Create Company
            </h2>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Company Name"
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              required
            />
            <Input
              label="Company Code"
              value={form.companyCode}
              onChange={(e) =>
                setForm({ ...form, companyCode: e.target.value.toUpperCase() })
              }
              required
              helperText="Unique short code, e.g. ACME"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Company Type
              </label>
              <select
                value={form.companyType}
                onChange={(e) =>
                  setForm({ ...form, companyType: e.target.value })
                }
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="">Select company type</option>
                <option value="realestate">Real Estate</option>
                <option value="hospital">Hospital</option>
                <option value="hotel">Hotel</option>
                <option value="clothing">Clothing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Company Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Company Phone"
              value={form.companyMobile}
              onChange={(e) =>
                setForm({ ...form, companyMobile: e.target.value })
              }
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Admin Name"
              value={form.adminName}
              onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              required
            />
            <Input
              label="Admin Email"
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              required
            />
            <Input
              label="Admin Password"
              type={showAdminPassword ? "text" : "password"}
              value={form.adminPassword}
              onChange={(e) =>
                setForm({ ...form, adminPassword: e.target.value })
              }
              required
              helperText="A random password is generated for the admin and can be edited before submitting."
              icon={
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-900"
                  onClick={() => setShowAdminPassword((current) => !current)}
                  aria-label={
                    showAdminPassword ? "Hide password" : "Show password"
                  }
                >
                  {showAdminPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
            <Input
              label="Executive Registration Password"
              type={showExecutiveRegistrationPassword ? "text" : "password"}
              value={form.executiveRegistrationPassword}
              onChange={(e) =>
                setForm({
                  ...form,
                  executiveRegistrationPassword: e.target.value,
                })
              }
              helperText="A random password is generated for executives and can be edited before submitting."
              icon={
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-900"
                  onClick={() =>
                    setShowExecutiveRegistrationPassword((current) => !current)
                  }
                  aria-label={
                    showExecutiveRegistrationPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showExecutiveRegistrationPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
            <Input
              label="Admin Phone"
              value={form.adminMobile}
              onChange={(e) =>
                setForm({ ...form, adminMobile: e.target.value })
              }
            />
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Company"}
            </Button>
          </form>
        </Card>

        <Card padding="lg" className="bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Company Registry
            </h2>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading companies...</p>
            ) : companies.length === 0 ? (
              <p className="text-sm text-slate-500">
                No companies created yet.
              </p>
            ) : (
              (companies as Company[]).map((company) => (
                <div
                  key={company.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {company.company_name}
                        </h3>
                        <Badge
                          variant={
                            company.status === "ACTIVE"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {company.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 font-mono">
                        {company.company_code}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Type: {company.company_type || "—"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {company.email || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {company.status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deactivateMutation.mutate(company.id)}
                          disabled={deactivateMutation.isPending}
                        >
                          <PowerOff className="w-4 h-4 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => activateMutation.mutate(company.id)}
                          disabled={activateMutation.isPending}
                        >
                          <Power className="w-4 h-4 mr-1" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
