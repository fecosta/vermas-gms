import Link from "next/link";
import { getContacts } from "@/lib/db/contacts";
import { getOrganizations } from "@/lib/db/organizations";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateContactDialog } from "@/components/contacts/contact-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";

export default async function ContactsPage() {
  const [contacts, orgs] = await Promise.all([getContacts(), getOrganizations()]);
  const orgOptions = orgs.map((o) => ({ id: o.id, name: o.name }));

  type ContactRow = (typeof contacts)[number];
  const columns: DataTableColumn<ContactRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (c) => (
        <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
          {c.fullName}
        </Link>
      ),
    },
    {
      key: "title",
      header: "Title",
      cell: (c) => <span className="text-muted-foreground">{c.title ?? "—"}</span>,
    },
    { key: "email", header: "Email", cell: (c) => c.email },
    {
      key: "org",
      header: "Organization",
      cell: (c) =>
        c.organization ? (
          <Link
            href={`/organizations/${c.organization.id}`}
            className="text-muted-foreground hover:underline"
          >
            {c.organization.name}
          </Link>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="All known contacts across organizations."
        action={<CreateContactDialog organizations={orgOptions} />}
      />
      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          description="Contacts are added when you create or edit an organization."
        />
      ) : (
        <DataTable columns={columns} rows={contacts} getRowKey={(c) => c.id} />
      )}
    </div>
  );
}
