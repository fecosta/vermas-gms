"use client";

import { useState, useTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateArea, deleteArea } from "@/app/actions/areas";
import { PencilIcon, XIcon, CheckIcon } from "lucide-react";

interface Area {
  id: string;
  name: string;
  description: string | null;
  _count: { users: number; initiatives: number };
}

interface Props {
  areas: Area[];
}

function AreaRow({ area }: { area: Area }) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const boundUpdate = updateArea.bind(null, area.id);
  const [editState, editAction, editPending] = useActionState(
    async (prev: { errors?: Record<string, string[]>; message?: string } | null, fd: FormData) => {
      const result = await boundUpdate(prev, fd);
      if (result?.message && !result?.errors) setEditing(false);
      return result;
    },
    null
  );

  const handleDelete = () => {
    setDeleteError(undefined);
    startTransition(async () => {
      const result = await deleteArea(area.id);
      if (result?.error) setDeleteError(result.error);
    });
  };

  const inUse = area._count.users > 0 || area._count.initiatives > 0;

  if (editing) {
    return (
      <div className="py-3 border-b last:border-0 space-y-2">
        <form action={editAction} className="space-y-2">
          <div className="flex gap-2">
            <Input name="name" defaultValue={area.name} className="h-8 text-sm" />
            <Button type="submit" size="sm" variant="ghost" className="h-8 px-2" disabled={editPending}>
              <CheckIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => setEditing(false)}
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
          <Textarea name="description" defaultValue={area.description ?? ""} rows={2} className="text-sm" placeholder="Description…" />
          {editState?.errors?.name && (
            <p className="text-xs text-destructive">{editState.errors.name[0]}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{area.name}</p>
          {area.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{area.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {area._count.users} user{area._count.users !== 1 ? "s" : ""} ·{" "}
            {area._count.initiatives} initiative{area._count.initiatives !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setEditing(true)}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={inUse || isPending}
            title={inUse ? "Cannot delete: area is in use" : "Delete area"}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>
      {deleteError && <p className="text-xs text-destructive mt-1">{deleteError}</p>}
    </div>
  );
}

export function AreaList({ areas }: Props) {
  if (areas.length === 0) {
    return <p className="text-sm text-muted-foreground">No areas yet.</p>;
  }
  return (
    <div>
      {areas.map((area) => (
        <AreaRow key={area.id} area={area} />
      ))}
    </div>
  );
}
