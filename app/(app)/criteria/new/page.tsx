"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { createCriteriaSet } from "@/app/actions/criteria";
import { ChevronLeftIcon } from "lucide-react";

type State = { errors?: Record<string, string[]>; message?: string } | null;

export default function NewCriteriaSetPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(createCriteriaSet, null);

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/criteria" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to criteria
        </Button>
        <PageHeader title="New criteria set" />
      </div>

      <form action={formAction} className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" placeholder="e.g. Standard evaluation criteria" />
          {state?.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Brief description of when to use this criteria set…"
          />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create criteria set"}
        </Button>
      </form>
    </div>
  );
}
