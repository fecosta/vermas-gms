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
import { setUserActive, updateUserRole } from "@/app/actions/users";
import type { Role } from "@/app/generated/prisma/enums";

const ROLES_NEEDING_AREA = ["AL", "AT", "KMD"] as const;

interface UserActionsCellProps {
  userId: string;
  currentUserId: string;
  isActive: boolean;
  currentRole: Role;
  currentAreaId: string | null;
  areas: { id: string; name: string }[];
}

export function UserActionsCell({
  userId,
  currentUserId,
  isActive,
  currentRole,
  currentAreaId,
  areas,
}: UserActionsCellProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<Role>(currentRole);
  const [areaId, setAreaId] = useState<string>(currentAreaId ?? "");
  const [error, setError] = useState<string | null>(null);

  const isSelf = userId === currentUserId;
  const showAreaSelect = ROLES_NEEDING_AREA.includes(role as (typeof ROLES_NEEDING_AREA)[number]);

  const handleToggleActive = () => {
    setError(null);
    startTransition(async () => {
      const result = await setUserActive(userId, !isActive);
      if (result?.error) setError(result.error);
    });
  };

  const handleRoleUpdate = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, role, areaId || null);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={role}
        onValueChange={(v) => v && setRole(v as Role)}
      >
        <SelectTrigger className="h-7 text-xs w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CEO">CEO</SelectItem>
          <SelectItem value="KMD">KMD</SelectItem>
          <SelectItem value="AL">AL</SelectItem>
          <SelectItem value="AT">AT</SelectItem>
          <SelectItem value="AD">AD</SelectItem>
          <SelectItem value="TL">TL</SelectItem>
          <SelectItem value="PEER_REVIEWER">Peer Reviewer</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>

      {showAreaSelect && (
        <Select
          value={areaId}
          onValueChange={(v) => setAreaId(v ?? "")}
        >
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue placeholder="Area…" />
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
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={isPending}
        onClick={handleRoleUpdate}
      >
        Update
      </Button>

      <Button
        variant={isActive ? "ghost" : "outline"}
        size="sm"
        className={`h-7 text-xs ${isActive ? "text-destructive hover:text-destructive" : ""}`}
        disabled={isPending || isSelf}
        title={isSelf ? "Cannot deactivate your own account" : undefined}
        onClick={handleToggleActive}
      >
        {isActive ? "Deactivate" : "Reactivate"}
      </Button>

      {error && <p className="text-xs text-destructive w-full">{error}</p>}
    </div>
  );
}
