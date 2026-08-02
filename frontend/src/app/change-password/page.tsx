"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Card } from "@/src/components/ui";
import { useChangePassword } from "@/src/hooks/useAuth";
import {
  changePasswordSchema,
  ChangePasswordFormData,
} from "@/src/utils/validation";
import { Lock } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const changePasswordMutation = useChangePassword();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccessMsg(
        "Password changed successfully. Redirecting to dashboard...",
      );
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      setErrorMsg(
        error.message || "Unable to change password. Please try again.",
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
          Change Password
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          You must update your password before continuing.
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
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                {successMsg}
              </div>
            )}

            <div>
              <Input
                label="Current Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-slate-400" />}
                placeholder="••••••••"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
            </div>

            <div>
              <Input
                label="New Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-slate-400" />}
                placeholder="••••••••"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
            </div>

            <div>
              <Input
                label="Confirm New Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-slate-400" />}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending
                ? "Updating..."
                : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
