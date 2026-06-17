"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GrantFormState } from "@/app/actions/grants";
import type { GrantDetail } from "@/lib/db/grants";

interface GrantFormProps {
  action: (prev: GrantFormState, formData: FormData) => Promise<GrantFormState>;
  grant?: GrantDetail | null;
}

const SUPPORT_OPTIONS = [
  { value: "MEL", label: "Monitoring, Evaluation & Learning (MEL)" },
  { value: "TECH", label: "Technical (TECH)" },
  { value: "STRATEGIC", label: "Strategic" },
];

export function GrantForm({ action, grant }: GrantFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step={0.01}
            defaultValue={grant?.amount ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            placeholder="USD"
            defaultValue={grant?.currency ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reportingCadence">Reporting cadence</Label>
          <Input
            id="reportingCadence"
            name="reportingCadence"
            placeholder="e.g. Quarterly"
            defaultValue={grant?.reportingCadence ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nextReportDue">Next report due</Label>
          <Input
            id="nextReportDue"
            name="nextReportDue"
            type="date"
            defaultValue={
              grant?.nextReportDue
                ? new Date(grant.nextReportDue).toISOString().split("T")[0]
                : ""
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Support types</Label>
        <div className="space-y-1">
          {SUPPORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="supportType"
                value={opt.value}
                defaultChecked={grant?.supportType.includes(opt.value as "MEL" | "TECH" | "STRATEGIC")}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scope">Scope</Label>
        <Textarea id="scope" name="scope" rows={3} defaultValue={grant?.scope ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reportingConditions">Reporting conditions</Label>
        <Textarea
          id="reportingConditions"
          name="reportingConditions"
          rows={3}
          defaultValue={grant?.reportingConditions ?? ""}
        />
      </div>

      {state?.errors?.amount && (
        <p className="text-sm text-destructive">{state.errors.amount[0]}</p>
      )}
      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save grant details"}
      </Button>
    </form>
  );
}
