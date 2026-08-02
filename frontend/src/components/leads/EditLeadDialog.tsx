"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, Button, Input, Select } from "@/src/components/ui";
import { updateLeadSchema, UpdateLeadFormData } from "@/src/utils/validation";
import { useUpdateLead, useCurrentUser, useUsers } from "@/src/hooks";
import { Lead } from "@/src/types";
import { leadService } from "@/src/services/services";

interface EditLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

export const EditLeadDialog: React.FC<EditLeadDialogProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<UpdateLeadFormData>({
    resolver: zodResolver(updateLeadSchema),
    defaultValues: {
      customerName: lead.customerName,
      email: lead.email,
      mobile: lead.mobile,
      alternateMobile: lead.alternateMobile,
      status: lead.status ?? "NEW",
      source: lead.source,
      budget: lead.budget,
      location: lead.location,
      occupation: lead.occupation,
      notes: lead.notes,
    },
  });
  const updateMutation = useUpdateLead();
  const { data: currentUser } = useCurrentUser();
  const [selectedPhoto, setSelectedPhoto] = React.useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(
    lead.photoUrl ?? null,
  );
  const { data: users = [] } = useUsers({
    enabled: isOpen && currentUser?.role === "ADMIN",
  });
  const executives = users.filter(
    (user) => user.role === "EXECUTIVE" && user.is_active,
  );

  // Re-populate form whenever the dialog opens or a different lead is passed in
  useEffect(() => {
    if (isOpen) {
      reset({
        customerName: lead.customerName,
        email: lead.email,
        mobile: lead.mobile,
        alternateMobile: lead.alternateMobile,
        status: lead.status ?? "NEW",
        source: lead.source,
        budget: lead.budget,
        location: lead.location,
        occupation: lead.occupation,
        assignedTo: lead.assignedTo || "",
        notes: lead.notes,
      });
      setPhotoPreview(lead.photoUrl ?? null);
      setSelectedPhoto(null);
      setRemovePhoto(false);
    }
  }, [isOpen, lead, reset]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const preview = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [selectedPhoto]);

  const onSubmit = async (data: UpdateLeadFormData) => {
    try {
      const photoUrl = selectedPhoto
        ? (await leadService.uploadLeadPhoto(selectedPhoto)).path
        : removePhoto
          ? null
          : undefined;
      await updateMutation.mutateAsync({
        id: lead.id,
        input: { ...(data as UpdateLeadFormData), photoUrl } as any,
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to update lead:", error);
      const errorMessage =
        error.message || "Failed to update lead. Please try again.";
      setError("root", { type: "manual", message: errorMessage });
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Lead"
      description="Update lead information"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {errors.root.message}
          </div>
        )}

        <Input
          label="Name"
          {...register("customerName")}
          error={errors.customerName?.message}
        />

        <Input
          label="Email"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <Input
          label="Mobile"
          type="tel"
          {...register("mobile")}
          error={errors.mobile?.message}
        />

        <Input
          label="Alternate Mobile"
          type="tel"
          {...register("alternateMobile")}
          error={errors.alternateMobile?.message}
        />

        <Select
          label="Status"
          {...register("status")}
          error={errors.status?.message}
          options={[
            { value: "NEW", label: "New" },
            { value: "CONTACTED", label: "Contacted" },
            { value: "FOLLOW_UP", label: "Follow Up" },
            { value: "INTERESTED", label: "Interested" },
            { value: "SITE_VISIT", label: "Site Visit" },
            { value: "NEGOTIATION", label: "Negotiation" },
            { value: "BOOKED", label: "Booked" },
            { value: "LOST", label: "Lost" },
          ]}
        />

        <Select
          label="Lead Source"
          {...register("source")}
          error={errors.source?.message}
          options={[
            { value: "WEBSITE", label: "Website" },
            { value: "FACEBOOK", label: "Facebook" },
            { value: "INSTAGRAM", label: "Instagram" },
            { value: "WHATSAPP", label: "WhatsApp" },
            { value: "GOOGLE", label: "Google" },
            { value: "REFERRAL", label: "Referral" },
            { value: "WALK_IN", label: "Walk In" },
            { value: "OTHER", label: "Other" },
          ]}
        />

        <Input
          label="Budget"
          type="number"
          {...register("budget", { valueAsNumber: true })}
          error={errors.budget?.message}
        />

        <Input
          label="Location"
          {...register("location")}
          error={errors.location?.message}
        />

        <Input
          label="Occupation"
          {...register("occupation")}
          error={errors.occupation?.message}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Lead Photo
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(event) => {
              setSelectedPhoto(event.target.files?.[0] ?? null);
              setRemovePhoto(false);
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          />
          <div className="mt-3 flex items-center gap-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Lead preview"
                className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                No photo
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedPhoto(null);
                  setPhotoPreview(null);
                  setRemovePhoto(true);
                }}
              >
                Remove photo
              </Button>
            </div>
          </div>
        </div>
        {/* <Input
          label="Next Follow Up"
          type="datetime-local"
          {...register("nextFollowupDate")}
          error={errors.nextFollowupDate?.message}
        /> */}
        {currentUser?.role === "ADMIN" && (
          <Select
            label="Assign Executive"
            {...register("assignedTo")}
            disabled={lead.status === "BOOKED" || lead.status === "LOST"}
            error={errors.assignedTo?.message}
            options={[
              { value: "", label: "Unassigned" },
              ...executives.map((executive) => ({
                value: executive.id,
                label: executive.name,
              })),
            ]}
          />
        )}
        <Input
          label="Notes"
          {...register("notes")}
          error={errors.notes?.message}
        />

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            Update Lead
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
