import Link from "next/link";
import { getContacts } from "@/lib/db/contacts";
import { getOrganizations } from "@/lib/db/organizations";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateContactDialog } from "@/components/contacts/contact-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ContactsPage() {
  const [contacts, orgs] = await Promise.all([
    getContacts(),
    getOrganizations(),
  ]);

  const orgOptions = orgs.map((o) => ({ id: o.id, name: o.name }));

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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/contacts/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.title ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm">
                    {c.organization ? (
                      <Link
                        href={`/organizations/${c.organization.id}`}
                        className="hover:underline text-muted-foreground"
                      >
                        {c.organization.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
