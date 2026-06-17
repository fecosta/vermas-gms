"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateMemo } from "@/app/actions/memos";

interface MemoEditorProps {
  memoId: string;
  initialBody: string;
}

export function MemoEditor({ memoId, initialBody }: MemoEditorProps) {
  const boundAction = updateMemo.bind(null, memoId);
  const [state, formAction, pending] = useActionState(boundAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <Textarea
        name="body"
        rows={16}
        defaultValue={initialBody}
        placeholder="Write the investment memo here…"
        className="font-mono text-sm"
      />
      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save memo"}
      </Button>
    </form>
  );
}
