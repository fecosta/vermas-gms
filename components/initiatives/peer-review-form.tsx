"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPeerReview } from "@/app/actions/memos";

export function PeerReviewForm({ reviewId }: { reviewId: string }) {
  const boundAction = submitPeerReview.bind(null, reviewId);
  const [state, formAction, pending] = useActionState(boundAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reviewText">Review comments *</Label>
        <Textarea
          id="reviewText"
          name="reviewText"
          rows={10}
          placeholder="Provide your detailed review comments here…"
          aria-invalid={!!state?.errors?.reviewText}
        />
        {state?.errors?.reviewText && (
          <p className="text-xs text-destructive">{state.errors.reviewText[0]}</p>
        )}
      </div>
      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
