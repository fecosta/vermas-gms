"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusChip } from "@/components/ui/status-chip";
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
  const columns: DataTableColumn<OrgWithCounts>[] = [
    {
      key: "name",
      header: "Name",
      cell: (org) => (
        <div>
          <Link href={`/organizations/${org.id}`} className="font-medium hover:underline">
            {org.name}
          </Link>
          {org.legalName && org.legalName !== org.name && (
            <p className="text-xs text-muted-foreground">{org.legalName}</p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (org) => <StatusChip tone="neutral">{TYPE_LABELS[org.type] ?? org.type}</StatusChip>,
    },
    { key: "country", header: "Country", cell: (org) => org.country },
    {
      key: "initiatives",
      header: "Initiatives",
      headerClassName: "text-center",
      className: "text-center",
      cell: (org) => org._count.initiatives,
    },
    {
      key: "contacts",
      header: "Contacts",
      headerClassName: "text-center",
      className: "text-center",
      cell: (org) => org._count.contacts,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (org) => <EditOrganizationDialog org={org} />,
    },
  ];

  return <DataTable columns={columns} rows={organizations} getRowKey={(o) => o.id} />;
}
