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
import { updateMeeting } from "@/app/actions/meetings";
import { PencilIcon } from "lucide-react";

interface Meeting {
  id: string;
  type: string;
  title: string;
  dateTime: Date | string;
  externalParticipants?: string | null;
  agenda?: string | null;
  minutes?: string | null;
  decisions?: string | null;
}

interface EditMeetingDialogProps {
  meeting: Meeting;
}

export function EditMeetingDialog({ meeting }: EditMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const boundAction = updateMeeting.bind(null, meeting.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" />}>
        <PencilIcon className="size-3.5" />
        <span className="sr-only">Edit meeting</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
        </DialogHeader>
        <MeetingForm
          action={boundAction}
          initial={meeting}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
