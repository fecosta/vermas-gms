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
import { ContactForm } from "./contact-form";
import { createContact, updateContact } from "@/app/actions/contacts";
import type { ContactDetail } from "@/lib/db/contacts";
import { PlusIcon } from "lucide-react";

interface CreateContactDialogProps {
  defaultOrgId?: string;
  organizations?: { id: string; name: string }[];
}

export function CreateContactDialog({
  defaultOrgId,
  organizations = [],
}: CreateContactDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PlusIcon className="size-4 mr-1" />
        Add contact
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
        </DialogHeader>
        <ContactForm
          action={createContact}
          defaultValues={defaultOrgId ? { organizationId: defaultOrgId } : undefined}
          organizations={organizations}
          onSuccess={(id) => {
            setOpen(false);
            if (id) router.push(`/contacts/${id}`);
          }}
          submitLabel="Create contact"
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditContactDialogProps {
  contact: ContactDetail;
  organizations: { id: string; name: string }[];
}

export function EditContactDialog({
  contact,
  organizations,
}: EditContactDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
        </DialogHeader>
        <ContactForm
          action={updateContact.bind(null, contact.id)}
          defaultValues={{
            fullName: contact.fullName,
            email: contact.email,
            phone: contact.phone ?? "",
            title: contact.title ?? "",
            organizationId: contact.organizationId ?? "",
          }}
          organizations={organizations}
          onSuccess={() => setOpen(false)}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}
