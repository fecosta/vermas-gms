"use client";

import { useState, useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser } from "@/app/actions/users";
import { UserPlusIcon } from "lucide-react";

const ROLES_NEEDING_AREA = ["AL", "AT", "KMD"] as const;

interface InviteUserDialogProps {
  areas: { id: string; name: string }[];
}

export function InviteUserDialog({ areas }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [state, formAction, pending] = useActionState(inviteUser, null);

  const showAreaSelect = ROLES_NEEDING_AREA.includes(
    selectedRole as (typeof ROLES_NEEDING_AREA)[number]
  );

  useEffect(() => {
    if (!open) {
      setSelectedRole("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlusIcon className="size-4 mr-1" />
        Invite user
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
        </DialogHeader>

        {state?.success ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              User created. They can sign in with their Vélezreyes+ Google
              Workspace account using this email address.
            </p>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" name="name" placeholder="e.g. Ana Castillo" />
              {state?.errors?.name && (
                <p className="text-xs text-destructive">{state.errors.name[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="user@vermas.org" />
              {state?.errors?.email && (
                <p className="text-xs text-destructive">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role *</Label>
              <Select
                name="role"
                onValueChange={(v: string | null) => setSelectedRole(v ?? "")}
              >
                <SelectTrigger id="role" className="w-full" aria-invalid={!!state?.errors?.role}>
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="KMD">KMD</SelectItem>
                  <SelectItem value="AL">AL — Area Lead</SelectItem>
                  <SelectItem value="AT">AT — Area Team</SelectItem>
                  <SelectItem value="AD">AD — Admin Director</SelectItem>
                  <SelectItem value="TL">TL — Tech Lead</SelectItem>
                  <SelectItem value="PEER_REVIEWER">Peer Reviewer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.role && (
                <p className="text-xs text-destructive">{state.errors.role[0]}</p>
              )}
            </div>

            {showAreaSelect && (
              <div className="space-y-1.5">
                <Label htmlFor="areaId">Area</Label>
                <Select name="areaId">
                  <SelectTrigger id="areaId" className="w-full">
                    <SelectValue placeholder="Select area (optional)…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating user…" : "Create user"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
