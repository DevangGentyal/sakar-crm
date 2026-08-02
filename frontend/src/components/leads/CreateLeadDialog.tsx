import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, Button, Input, Select } from "@/src/components/ui";
import { createLeadSchema, CreateLeadFormData } from "@/src/utils/validation";
import { useCreateLead, useCurrentUser, useUsers } from "@/src/hooks";
import { leadService } from "@/src/services/services";

interface CreateLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLeadDialog: React.FC<CreateLeadDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
  });
  const createMutation = useCreateLead();
  const { data: currentUser } = useCurrentUser();
  const [selectedPhoto, setSelectedPhoto] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const { data: users = [] } = useUsers({
    enabled: isOpen && currentUser?.role === "ADMIN",
  });
  const executives = users.filter(
    (user) => user.role === "EXECUTIVE" && user.is_active,
  );

  const onSubmit = async (data: CreateLeadFormData) => {
    try {
      const photoUrl = selectedPhoto
        ? (await leadService.uploadLeadPhoto(selectedPhoto)).path
        : undefined;
      await createMutation.mutateAsync({
        ...(data as CreateLeadFormData),
        photoUrl,
      } as any);
      reset();
      setSelectedPhoto(null);
      onClose();
    } catch (error: any) {
      console.error("Failed to create lead:", error);
      const errorMessage =
        error.message || "Failed to create lead. Please try again.";
      setError("root", { type: "manual", message: errorMessage });
    }
  };

  React.useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreview(null);
      return;
    }
    const preview = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [selectedPhoto]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Lead"
      description="Add a new real estate lead to your pipeline"
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
          required
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
          required
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
          label="Lead Source"
          required
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
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          />
          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG, and WEBP only. Max 5 MB.
          </p>
          <div className="mt-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Lead preview"
                className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 text-xs text-center">
                No photo selected
              </div>
            )}
          </div>
        </div>
        {/* <Input label="Next Follow Up" type="datetime-local" {...register('nextFollowupDate')} error={errors.nextFollowupDate?.message} /> */}
        {currentUser?.role === "ADMIN" && (
          <Select
            label="Assign Executive"
            {...register("assignedTo")}
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
          <Button
            type="submit"
            loading={createMutation.isPending ? "true" : undefined}
          >
            Create Lead
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
