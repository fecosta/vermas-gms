"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContactFormState } from "@/app/actions/contacts";

interface ContactFormProps {
  action: (prev: ContactFormState, formData: FormData) => Promise<ContactFormState>;
  defaultValues?: {
    fullName?: string;
    email?: string;
    phone?: string;
    title?: string;
    organizationId?: string;
  };
  organizations: { id: string; name: string }[];
  onSuccess?: (id?: string) => void;
  submitLabel?: string;
}

export function ContactForm({
  action,
  defaultValues,
  organizations,
  onSuccess,
  submitLabel = "Save",
}: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.message && !state.errors) {
      onSuccess?.(state.id);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="fullName">Full name *</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={defaultValues?.fullName}
            required
            aria-invalid={!!state?.errors?.fullName}
          />
          {state?.errors?.fullName && (
            <p className="text-xs text-destructive">{state.errors.fullName[0]}</p>
          )}
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email}
            required
            aria-invalid={!!state?.errors?.email}
          />
          {state?.errors?.email && (
            <p className="text-xs text-destructive">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Executive Director"
            defaultValue={defaultValues?.title ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues?.phone ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organizationId">Organization</Label>
        <Select
          name="organizationId"
          defaultValue={defaultValues?.organizationId ?? ""}
        >
          <SelectTrigger id="organizationId" className="w-full">
            <SelectValue placeholder="None (individual)" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
