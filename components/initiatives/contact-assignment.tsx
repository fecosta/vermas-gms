"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XIcon } from "lucide-react";
import {
  linkContactToInitiative,
  unlinkContactFromInitiative,
} from "@/app/actions/contacts";

interface ContactLink {
  contactId: string;
  contact: { id: string; fullName: string; title: string | null };
}

interface Props {
  initiativeId: string;
  linked: ContactLink[];
  allContacts: { id: string; fullName: string; title: string | null }[];
}

export function ContactAssignment({ initiativeId, linked, allContacts }: Props) {
  const [addValue, setAddValue] = useState("__none__");
  const [isPending, startTransition] = useTransition();

  const unlinked = allContacts.filter((c) => !linked.some((l) => l.contactId === c.id));

  const handleAdd = (value: string | null) => {
    if (!value || value === "__none__") return;
    setAddValue("__none__");
    startTransition(async () => {
      await linkContactToInitiative(initiativeId, value);
    });
  };

  const handleRemove = (contactId: string) => {
    startTransition(async () => {
      await unlinkContactFromInitiative(initiativeId, contactId);
    });
  };

  return (
    <div className="space-y-2">
      {linked.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts assigned.</p>
      ) : (
        <div className="space-y-1.5">
          {linked.map((ic) => (
            <div key={ic.contactId} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{ic.contact.fullName}</p>
                {ic.contact.title && (
                  <p className="text-xs text-muted-foreground truncate">{ic.contact.title}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleRemove(ic.contactId)}
                className="h-6 w-6 p-0 shrink-0"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {unlinked.length > 0 && (
        <Select
          value={addValue}
          onValueChange={(v: string | null) => handleAdd(v)}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Add contact…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs text-muted-foreground">
              Add contact…
            </SelectItem>
            {unlinked.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.fullName}
                {c.title ? ` · ${c.title}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
