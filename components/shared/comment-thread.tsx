"use client";

import { useActionState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CommentWithAuthor } from "@/lib/db/comments";

type State = { errors?: Record<string, string[]>; message?: string } | null;

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  addCommentAction: (prev: State, formData: FormData) => Promise<State>;
  canViewInternal: boolean;
  canSetInternal: boolean;
}

export function CommentThread({
  comments,
  addCommentAction,
  canViewInternal,
  canSetInternal,
}: CommentThreadProps) {
  const [state, formAction, pending] = useActionState(addCommentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message && !state?.errors) {
      formRef.current?.reset();
    }
  }, [state]);

  const visible = canViewInternal
    ? comments
    : comments.filter((c) => !c.isInternal);

  return (
    <div className="space-y-4">
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((comment) => (
            <div key={comment.id} className="text-sm">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {comment.author.name[0]}
                </span>
                <span className="font-medium">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {comment.author.role.replace("_", " ")}
                </span>
                {comment.isInternal && (
                  <Badge variant="outline" className="text-xs py-0 h-4">
                    Internal
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-muted-foreground pl-7 whitespace-pre-wrap">
                {comment.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} ref={formRef} className="space-y-2 pt-2 border-t">
        <Textarea
          name="body"
          placeholder="Add a comment…"
          rows={3}
          className="text-sm"
        />
        {state?.errors?.body && (
          <p className="text-xs text-destructive">{state.errors.body[0]}</p>
        )}
        {canSetInternal && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="isInternal" className="rounded" />
            Internal (not visible to external parties)
          </label>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post comment"}
        </Button>
      </form>
    </div>
  );
}
