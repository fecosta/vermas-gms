import Link from "next/link";
import { notFound } from "next/navigation";
import { getContact } from "@/lib/db/contacts";
import { getOrganizations } from "@/lib/db/organizations";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge } from "@/components/shared/stage-badge";
import { EditContactDialog } from "@/components/contacts/contact-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;

  let contact;
  let orgs;
  try {
    [contact, orgs] = await Promise.all([getContact(id), getOrganizations()]);
  } catch {
    notFound();
  }

  const orgOptions = orgs.map((o) => ({ id: o.id, name: o.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.fullName}
        description={contact.title ?? contact.email}
        action={<EditContactDialog contact={contact} organizations={orgOptions} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Contact details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Email">
            <a href={`mailto:${contact.email}`} className="underline underline-offset-3">
              {contact.email}
            </a>
          </Row>
          {contact.phone && <Row label="Phone" value={contact.phone} />}
          {contact.title && <Row label="Title" value={contact.title} />}
          {contact.organization && (
            <Row label="Organization">
              <Link
                href={`/organizations/${contact.organization.id}`}
                className="underline underline-offset-3"
              >
                {contact.organization.name}
              </Link>
            </Row>
          )}
        </CardContent>
      </Card>

      {contact.primaryForInitiatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Primary contact for ({contact.primaryForInitiatives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {contact.primaryForInitiatives.map((init) => (
                <div
                  key={init.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <Link
                    href={`/initiatives/${init.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {init.name}
                  </Link>
                  <StageBadge stage={init.stage} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      {children ?? <span>{value}</span>}
    </div>
  );
}
