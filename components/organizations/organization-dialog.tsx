"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrganizationForm } from "./organization-form";
import { createOrganization, updateOrganization } from "@/app/actions/organizations";
type OrgFormData = {
  id: string;
  name: string;
  legalName?: string | null;
  country: string;
  website?: string | null;
  type: "NGO" | "COMPANY" | "INDIVIDUAL" | "OTHER";
  description?: string | null;
};
import { PlusIcon } from "lucide-react";

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon className="size-4 mr-1" />
        New organization
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New organization</DialogTitle>
        </DialogHeader>
        <OrganizationForm
          action={createOrganization}
          onSuccess={(id) => {
            setOpen(false);
            if (id) router.push(`/organizations/${id}`);
          }}
          submitLabel="Create organization"
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditOrganizationDialog({ org }: { org: OrgFormData }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit organization</DialogTitle>
        </DialogHeader>
        <OrganizationForm
          action={updateOrganization.bind(null, org.id)}
          defaultValues={org}
          onSuccess={() => setOpen(false)}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}
