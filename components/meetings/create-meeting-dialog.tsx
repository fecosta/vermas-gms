"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MeetingForm } from "@/components/meetings/meeting-form";
import { createMeeting } from "@/app/actions/meetings";
import { CalendarIcon } from "lucide-react";

interface CreateMeetingDialogProps {
  initiativeId: string;
}

export function CreateMeetingDialog({ initiativeId }: CreateMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const boundAction = createMeeting.bind(null, initiativeId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <CalendarIcon className="size-4 mr-1" />
        Log meeting
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log meeting</DialogTitle>
        </DialogHeader>
        <MeetingForm action={boundAction} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
