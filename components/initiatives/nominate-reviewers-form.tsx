"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nominatePeerReviewers } from "@/app/actions/memos";

interface Reviewer {
  id: string;
  name: string;
}

interface CurrentReview {
  id: string;
  reviewerId: string;
  status: string;
}

interface NominateReviewersFormProps {
  memoId: string;
  peerReviewers: Reviewer[];
  currentReviews: CurrentReview[];
}

export function NominateReviewersForm({
  memoId,
  peerReviewers,
  currentReviews,
}: NominateReviewersFormProps) {
  const boundAction = nominatePeerReviewers.bind(null, memoId);
  const [state, formAction, pending] = useActionState(boundAction, null);

  const [r1, r2] = currentReviews;

  return (
    <form action={formAction} className="space-y-3 pb-4 border-b">
      <p className="text-sm font-medium">Nominate peer reviewers</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reviewer1Id">Reviewer 1 *</Label>
          <Select name="reviewer1Id" defaultValue={r1?.reviewerId ?? ""}>
            <SelectTrigger id="reviewer1Id" className="w-full">
              <SelectValue placeholder="Select reviewer…" />
            </SelectTrigger>
            <SelectContent>
              {peerReviewers.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.errors?.reviewer1Id && (
            <p className="text-xs text-destructive">{state.errors.reviewer1Id[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reviewer2Id">Reviewer 2 *</Label>
          <Select name="reviewer2Id" defaultValue={r2?.reviewerId ?? ""}>
            <SelectTrigger id="reviewer2Id" className="w-full">
              <SelectValue placeholder="Select reviewer…" />
            </SelectTrigger>
            <SelectContent>
              {peerReviewers.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.errors?.reviewer2Id && (
            <p className="text-xs text-destructive">{state.errors.reviewer2Id[0]}</p>
          )}
        </div>
      </div>
      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Nominating…" : "Save nominations"}
      </Button>
    </form>
  );
}
