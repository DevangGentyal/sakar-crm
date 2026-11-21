"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Card } from "@/src/components/ui";
import { useLogin } from "@/src/hooks";
import { loginSchema, LoginFormData } from "@/src/utils/validation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { getApiErrorMessage } from "@/src/utils/api-error";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMsg("");
      const result = await loginMutation.mutateAsync(data);
      if (result.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      setErrorMsg(
        getApiErrorMessage(
          error,
          "Login failed. Please check your credentials.",
        ),
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
          Sign in to KARYAA CRM
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Or{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            create a new account
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

            <div>
              <Input
                label="Email address"
                type="email"
                icon={<Mail className="w-5 h-5 text-slate-400" />}
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="inline-flex items-center justify-center text-slate-400 transition-colors hover:text-slate-700 focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
