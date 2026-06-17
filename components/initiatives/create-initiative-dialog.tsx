"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInitiative } from "@/app/actions/initiatives";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { PlusIcon } from "lucide-react";

interface Area {
  id: string;
  name: string;
}

interface Org {
  id: string;
  name: string;
}

interface CreateInitiativeDialogProps {
  user: SessionUser;
  areas: Area[];
  organizations: Org[];
}

export function CreateInitiativeDialog({
  user,
  areas,
  organizations,
}: CreateInitiativeDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInitiative, null);

  if (!can(user, "initiative:create")) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon className="size-4 mr-1" />
        New initiative
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New initiative</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Initiative name"
              required
              aria-invalid={!!state?.errors?.name}
            />
            {state?.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="areaId">Area *</Label>
              <Select name="areaId" required>
                <SelectTrigger id="areaId" className="w-full" aria-invalid={!!state?.errors?.areaId}>
                  <SelectValue placeholder="Select area…" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors?.areaId && (
                <p className="text-xs text-destructive">{state.errors.areaId[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                name="country"
                required
                aria-invalid={!!state?.errors?.country}
              />
              {state?.errors?.country && (
                <p className="text-xs text-destructive">{state.errors.country[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="organizationId">Organization</Label>
            <Select name="organizationId">
              <SelectTrigger id="organizationId" className="w-full">
                <SelectValue placeholder="None (individual)" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary">
              Summary *{" "}
              <span className="text-muted-foreground font-normal">(≤100 words)</span>
            </Label>
            <Textarea
              id="summary"
              name="summary"
              rows={4}
              required
              aria-invalid={!!state?.errors?.summary}
            />
            {state?.errors?.summary && (
              <p className="text-xs text-destructive">{state.errors.summary[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              name="source"
              placeholder="How did this opportunity arise?"
            />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create initiative"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
