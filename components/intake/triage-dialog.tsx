"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DriveSearchPanel } from "@/components/documents/drive-search-panel";
import { triageIntake } from "@/app/actions/intake";
import type { TriageOptions } from "@/lib/db/intake";
import type { OrgType } from "@/app/generated/prisma/enums";

const ORG_TYPES: OrgType[] = ["NGO", "COMPANY", "INDIVIDUAL", "OTHER"];

type IntakeSummary = {
  id: string;
  submittedByName: string | null;
  submittedByEmail: string | null;
  submittedAt: Date;
  submissionUrl: string | null;
};

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-foreground/30"
      }`}
    >
      {children}
    </button>
  );
}

export function TriageDialog({
  intake,
  options,
}: {
  intake: IntakeSummary;
  options: TriageOptions;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"existing" | "new">("new");
  const [initiativeId, setInitiativeId] = useState("");
  const [orgChoice, setOrgChoice] = useState(""); // org id | "new" | ""
  const [newOrgName, setNewOrgName] = useState(intake.submittedByName ?? "");
  const [newOrgCountry, setNewOrgCountry] = useState("");
  const [newOrgType, setNewOrgType] = useState<OrgType>("NGO");
  const [initiativeName, setInitiativeName] = useState("");
  const [areaId, setAreaId] = useState("");
  const [assignedAlId, setAssignedAlId] = useState("");
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const base = { intakeId: intake.id, googleFileId: picked?.id };
      const payload =
        mode === "existing"
          ? { ...base, mode: "existing" as const, initiativeId }
          : {
              ...base,
              mode: "new" as const,
              organizationId:
                orgChoice && orgChoice !== "new" ? orgChoice : undefined,
              newOrg:
                orgChoice === "new"
                  ? { name: newOrgName, country: newOrgCountry, type: newOrgType }
                  : undefined,
              initiativeName,
              areaId,
              assignedAlId,
            };
      const res = await triageIntake(payload);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        if (res.initiativeId) router.push(`/initiatives/${res.initiativeId}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        Triage
      </Button>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Triage submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-xs">
          {intake.submittedByName && (
            <p>
              <span className="text-muted-foreground">From: </span>
              {intake.submittedByName}
            </p>
          )}
          {intake.submittedByEmail && (
            <p>
              <span className="text-muted-foreground">Email: </span>
              {intake.submittedByEmail}
            </p>
          )}
          {intake.submissionUrl && (
            <a
              href={intake.submissionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              View submission in Jotform ↗
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <ModeButton active={mode === "new"} onClick={() => setMode("new")}>
            New initiative
          </ModeButton>
          <ModeButton active={mode === "existing"} onClick={() => setMode("existing")}>
            Existing initiative
          </ModeButton>
        </div>

        {mode === "existing" ? (
          <div className="space-y-1.5">
            <Label>Initiative</Label>
            <select
              value={initiativeId}
              onChange={(e) => setInitiativeId(e.target.value)}
              className="h-8 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Select initiative…</option>
              {options.initiatives.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Organization</Label>
              <select
                value={orgChoice}
                onChange={(e) => setOrgChoice(e.target.value)}
                className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Select organization…</option>
                <option value="new">+ New organization</option>
                {options.organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {orgChoice === "new" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Input
                    placeholder="Organization name"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Country"
                  value={newOrgCountry}
                  onChange={(e) => setNewOrgCountry(e.target.value)}
                />
                <select
                  value={newOrgType}
                  onChange={(e) => setNewOrgType(e.target.value as OrgType)}
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Initiative name</Label>
              <Input
                value={initiativeName}
                onChange={(e) => setInitiativeName(e.target.value)}
                placeholder="e.g. Clean water pilot"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Area</Label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">Select area…</option>
                  {options.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Assigned AL</Label>
                <select
                  value={assignedAlId}
                  onChange={(e) => setAssignedAlId(e.target.value)}
                  className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">Select AL…</option>
                  {options.alUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Application PDF (optional)</Label>
          {picked ? (
            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="truncate">{picked.name}</span>
              <Button size="xs" variant="ghost" onClick={() => setPicked(null)}>
                Remove
              </Button>
            </div>
          ) : showPicker ? (
            <DriveSearchPanel
              onPick={(f) => {
                setPicked({ id: f.id, name: f.name });
                setShowPicker(false);
              }}
            />
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowPicker(true)}
            >
              Find PDF in Drive
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Triaging…" : "Triage"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
