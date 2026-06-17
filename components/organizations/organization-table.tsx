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
import { Badge } from "@/components/ui/badge";
import { EditOrganizationDialog } from "./organization-dialog";
import type { OrgWithCounts } from "@/lib/db/organizations";

const TYPE_LABELS: Record<string, string> = {
  NGO: "NGO",
  COMPANY: "Company",
  INDIVIDUAL: "Individual",
  OTHER: "Other",
};

interface OrganizationTableProps {
  organizations: OrgWithCounts[];
}

export function OrganizationTable({ organizations }: OrganizationTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="text-center">Initiatives</TableHead>
            <TableHead className="text-center">Contacts</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <Link
                  href={`/organizations/${org.id}`}
                  className="font-medium hover:underline"
                >
                  {org.name}
                </Link>
                {org.legalName && org.legalName !== org.name && (
                  <p className="text-xs text-muted-foreground">{org.legalName}</p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABELS[org.type] ?? org.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{org.country}</TableCell>
              <TableCell className="text-center text-sm">
                {org._count.initiatives}
              </TableCell>
              <TableCell className="text-center text-sm">
                {org._count.contacts}
              </TableCell>
              <TableCell>
                <EditOrganizationDialog org={org} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
