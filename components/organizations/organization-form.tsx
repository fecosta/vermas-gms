"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrgFormState } from "@/app/actions/organizations";

type OrgFormDefaults = {
  name?: string;
  legalName?: string | null;
  country?: string;
  website?: string | null;
  type?: "NGO" | "COMPANY" | "INDIVIDUAL" | "OTHER";
  description?: string | null;
};

interface OrganizationFormProps {
  action: (prev: OrgFormState, formData: FormData) => Promise<OrgFormState>;
  defaultValues?: OrgFormDefaults;
  onSuccess?: (id?: string) => void;
  submitLabel?: string;
}

export function OrganizationForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel = "Save",
}: OrganizationFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.message && !state.errors) {
      onSuccess?.(state.id);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          required
          aria-invalid={!!state?.errors?.name}
        />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="legalName">Legal name</Label>
        <Input
          id="legalName"
          name="legalName"
          defaultValue={defaultValues?.legalName ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            name="country"
            defaultValue={defaultValues?.country}
            required
            aria-invalid={!!state?.errors?.country}
          />
          {state?.errors?.country && (
            <p className="text-xs text-destructive">{state.errors.country[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue={defaultValues?.type ?? ""}>
            <SelectTrigger id="type" className="w-full" aria-invalid={!!state?.errors?.type}>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NGO">NGO</SelectItem>
              <SelectItem value="COMPANY">Company</SelectItem>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {state?.errors?.type && (
            <p className="text-xs text-destructive">{state.errors.type[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={defaultValues?.website ?? ""}
        />
        {state?.errors?.website && (
          <p className="text-xs text-destructive">{state.errors.website[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
