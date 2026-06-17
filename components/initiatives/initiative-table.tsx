"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StageBadge } from "@/components/shared/stage-badge";
import { formatDistanceToNow } from "@/lib/utils";
import type { InitiativeRow } from "@/lib/db/initiatives";

interface InitiativeTableProps {
  initiatives: InitiativeRow[];
}

export function InitiativeTable({ initiatives }: InitiativeTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>AL</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initiatives.map((init) => (
            <TableRow key={init.id}>
              <TableCell>
                <Link
                  href={`/initiatives/${init.id}`}
                  className="font-medium hover:underline"
                >
                  {init.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {init.organization?.name ?? "—"}
              </TableCell>
              <TableCell className="text-sm">{init.country}</TableCell>
              <TableCell>
                <StageBadge stage={init.stage} />
              </TableCell>
              <TableCell className="text-sm">{init.area.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {init.assignedAl.name}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(init.updatedAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
