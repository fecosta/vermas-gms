"use client";

import { useState, useEffect, useActionState, useTransition } from "react";
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
import { addKPI, deleteKPI } from "@/app/actions/grants";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type { GrantDetail } from "@/lib/db/grants";

type KPI = GrantDetail["kpis"][number];

interface KPITableProps {
  grantId: string;
  kpis: KPI[];
  canEdit: boolean;
}

function AddKPIDialog({ grantId }: { grantId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = addKPI.bind(null, grantId);
  const [state, formAction, pending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state?.message && !state.errors) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <PlusIcon className="size-4 mr-1" />
        Add KPI
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add KPI</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required aria-invalid={!!state?.errors?.name} />
            {state?.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target">Target</Label>
              <Input id="target" name="target" placeholder="e.g. 1000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cadence">Cadence</Label>
              <Input id="cadence" name="cadence" placeholder="e.g. Quarterly" />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding…" : "Add KPI"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KPIRow({ kpi, canEdit }: { kpi: KPI; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4">
        <div className="text-sm font-medium">{kpi.name}</div>
        {kpi.description && <div className="text-xs text-muted-foreground">{kpi.description}</div>}
      </td>
      <td className="py-2 pr-4 text-sm">{kpi.target ?? "—"}</td>
      <td className="py-2 pr-4 text-sm">{kpi.cadence ?? "—"}</td>
      {canEdit && (
        <td className="py-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => deleteKPI(kpi.id))}
          >
            <Trash2Icon className="size-4 text-muted-foreground" />
          </Button>
        </td>
      )}
    </tr>
  );
}

export function KPITable({ grantId, kpis, canEdit }: KPITableProps) {
  return (
    <div className="space-y-3">
      {canEdit && <AddKPIDialog grantId={grantId} />}
      {kpis.length === 0 ? (
        <p className="text-sm text-muted-foreground">No KPIs defined yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Target</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Cadence</th>
              {canEdit && <th className="pb-2" />}
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi) => (
              <KPIRow key={kpi.id} kpi={kpi} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
