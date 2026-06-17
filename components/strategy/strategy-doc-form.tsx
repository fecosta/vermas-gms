"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StrategyDocType } from "@/app/generated/prisma/enums";

type State = { errors?: Record<string, string[]>; message?: string } | null;

const TYPE_LABELS: Record<StrategyDocType, string> = {
  PROCESS_MAP: "Process Map",
  INVESTMENT_CRITERIA: "Investment Criteria",
  TOC: "Theory of Change",
  THESIS: "Thesis",
  LEARNING_AGENDA: "Learning Agenda",
};

interface StrategyDocFormProps {
  action: (prev: State, formData: FormData) => Promise<State>;
  areas: { id: string; name: string }[];
  defaultValues?: {
    title?: string;
    type?: StrategyDocType;
    body?: string;
    selectedAreaIds?: string[];
  };
}

export function StrategyDocForm({
  action,
  areas,
  defaultValues,
}: StrategyDocFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          placeholder="Document title"
          aria-invalid={!!state?.errors?.title}
        />
        {state?.errors?.title && (
          <p className="text-xs text-destructive">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Type *</Label>
        <Select name="type" defaultValue={defaultValues?.type}>
          <SelectTrigger id="type" className="w-64" aria-invalid={!!state?.errors?.type}>
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TYPE_LABELS) as StrategyDocType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.type && (
          <p className="text-xs text-destructive">{state.errors.type[0]}</p>
        )}
      </div>

      {areas.length > 0 && (
        <div className="space-y-1.5">
          <Label>Areas</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {areas.map((area) => (
              <label key={area.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="areaIds"
                  value={area.id}
                  defaultChecked={defaultValues?.selectedAreaIds?.includes(area.id)}
                  className="rounded"
                />
                {area.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          name="body"
          rows={14}
          defaultValue={defaultValues?.body}
          placeholder="Document content…"
          aria-invalid={!!state?.errors?.body}
          className="font-mono text-sm"
        />
        {state?.errors?.body && (
          <p className="text-xs text-destructive">{state.errors.body[0]}</p>
        )}
      </div>

      {state?.errors?._form && (
        <p className="text-sm text-destructive">{state.errors._form[0]}</p>
      )}
      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save document"}
      </Button>
    </form>
  );
}
