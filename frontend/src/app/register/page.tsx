"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Card } from "@/src/components/ui";
import { useRegister } from "@/src/hooks";
import { registerSchema, RegisterFormData } from "@/src/utils/validation";
import { User, Mail, Lock, Phone, Building2 } from "lucide-react";
import { companyService } from "@/src/services/services";
import { getApiErrorMessage } from "@/src/utils/api-error";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [errorMsg, setErrorMsg] = useState("");
  const [companyOptions, setCompanyOptions] = useState<
    Array<{ id: string; company_code: string; company_name: string }>
  >([]);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    companyService
      .list()
      .then((companies) => {
        setCompanyOptions(Array.isArray(companies) ? companies : []);
      })
      .catch(() => {
        setCompanyOptions([]);
      });
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const response = await registerMutation.mutateAsync(data);
      setSuccessMsg(
        response?.message ||
          "Registration submitted. Your account is awaiting administrator approval.",
      );
    } catch (error: any) {
      setErrorMsg(
        getApiErrorMessage(error, "Registration failed. Please try again."),
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-900/20">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card padding="lg" className="shadow-xl shadow-slate-200/50">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
                {successMsg}
              </div>
            )}

            <div>
              <Input
                label="Full Name"
                type="text"
                icon={<User className="w-5 h-5 text-slate-400" />}
                placeholder="John Doe"
                error={errors.name?.message}
                {...formRegister("name")}
              />
            </div>

            <div>
              <Input
                label="Email address"
                type="email"
                icon={<Mail className="w-5 h-5 text-slate-400" />}
                placeholder="you@example.com"
                error={errors.email?.message}
                {...formRegister("email")}
              />
            </div>

            <div>
              <Input
                label="Mobile number"
                type="tel"
                icon={<Phone className="w-5 h-5 text-slate-400" />}
                placeholder="9876543210"
                error={errors.mobileNumber?.message}
                {...formRegister("mobileNumber")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Company Code
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-blue-500"
                  {...formRegister("companyCode")}
                  defaultValue=""
                >
                  <option value="">Select a company</option>
                  {(Array.isArray(companyOptions) ? companyOptions : []).map(
                    (company) => (
                      <option key={company.id} value={company.company_code}>
                        {company.company_name} ({company.company_code})
                      </option>
                    ),
                  )}
                </select>
              </div>
              {errors.companyCode?.message ? (
                <p className="mt-2 text-sm text-red-600">
                  {errors.companyCode.message}
                </p>
              ) : null}
            </div>

            <div>
              <Input
                label="Executive Registration Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-slate-400" />}
                placeholder="Enter registration password"
                error={errors.registrationPassword?.message}
                {...formRegister("registrationPassword")}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-slate-400" />}
                placeholder="••••••••"
                error={errors.password?.message}
                {...formRegister("password")}
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-slate-400" />}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...formRegister("confirmPassword")}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Creating account..."
                : "Create account"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
