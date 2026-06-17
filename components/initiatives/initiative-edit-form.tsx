"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInitiative } from "@/app/actions/initiatives";
import type { InitiativeModel } from "@/app/generated/prisma/models";

interface Area {
  id: string;
  name: string;
}

interface Org {
  id: string;
  name: string;
}

interface InitiativeEditFormProps {
  initiative: InitiativeModel;
  areas: Area[];
  organizations: Org[];
}

export function InitiativeEditForm({
  initiative,
  areas,
  organizations,
}: InitiativeEditFormProps) {
  const boundAction = updateInitiative.bind(null, initiative.id);
  const [state, formAction, pending] = useActionState(boundAction, null);

  return (
    <form action={formAction} className="space-y-8">
      {/* Core fields */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Core information
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initiative.name}
            required
            aria-invalid={!!state?.errors?.name}
          />
          {state?.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="areaId">Area *</Label>
            <Select name="areaId" defaultValue={initiative.areaId}>
              <SelectTrigger id="areaId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              name="country"
              defaultValue={initiative.country}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organizationId">Organization</Label>
          <Select name="organizationId" defaultValue={initiative.organizationId ?? ""}>
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
          <Label htmlFor="individualName">Individual name</Label>
          <Input
            id="individualName"
            name="individualName"
            defaultValue={initiative.individualName ?? ""}
            placeholder="For opportunities with no org"
          />
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
            defaultValue={initiative.summary}
            required
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
            defaultValue={initiative.source ?? ""}
          />
        </div>
      </section>

      <Separator />

      {/* Assessment */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Assessment
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="fitScore">Fit score (0–10)</Label>
          <Input
            id="fitScore"
            name="fitScore"
            type="number"
            min={0}
            max={10}
            step={0.5}
            defaultValue={initiative.fitScore ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="thematicAlignment">Thematic alignment</Label>
          <Textarea
            id="thematicAlignment"
            name="thematicAlignment"
            rows={3}
            defaultValue={initiative.thematicAlignment ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="strategicFitNotes">Strategic fit notes</Label>
          <Textarea
            id="strategicFitNotes"
            name="strategicFitNotes"
            rows={3}
            defaultValue={initiative.strategicFitNotes ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="solutionStrengthNotes">Solution strength notes</Label>
          <Textarea
            id="solutionStrengthNotes"
            name="solutionStrengthNotes"
            rows={3}
            defaultValue={initiative.solutionStrengthNotes ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="executionCapacityNotes">Execution capacity notes</Label>
          <Textarea
            id="executionCapacityNotes"
            name="executionCapacityNotes"
            rows={3}
            defaultValue={initiative.executionCapacityNotes ?? ""}
          />
        </div>
      </section>

      <Separator />

      {/* Scoping call */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Scoping call
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="scopingCallStatus">Status</Label>
            <Select
              name="scopingCallStatus"
              defaultValue={initiative.scopingCallStatus ?? ""}
            >
              <SelectTrigger id="scopingCallStatus" className="w-full">
                <SelectValue placeholder="Not scheduled" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_SCHEDULED">Not scheduled</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scopingCallDate">Date</Label>
            <Input
              id="scopingCallDate"
              name="scopingCallDate"
              type="date"
              defaultValue={
                initiative.scopingCallDate
                  ? new Date(initiative.scopingCallDate).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="scopingCallNotes">Notes</Label>
          <Textarea
            id="scopingCallNotes"
            name="scopingCallNotes"
            rows={3}
            defaultValue={initiative.scopingCallNotes ?? ""}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Technical review
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="needsTechReview">Technical review required?</Label>
          <Select
            name="needsTechReview"
            defaultValue={initiative.needsTechReview ? "true" : "false"}
          >
            <SelectTrigger id="needsTechReview" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="outline" type="button" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
