import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getOrganization } from "@/lib/db/organizations";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { StageBadge } from "@/components/shared/stage-badge";
import { EditOrganizationDialog } from "@/components/organizations/organization-dialog";
import { CreateContactDialog } from "@/components/contacts/contact-dialog";
import { DocumentList } from "@/components/documents/document-list";
import { LinkDriveButton } from "@/components/documents/link-drive-button";
import { FolderLinkField } from "@/components/documents/folder-link-field";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  const canManage = can(user, "document:upload");

  let org;
  try {
    org = await getOrganization(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={org.name}
        description={org.country}
        action={<EditOrganizationDialog org={org} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {org.legalName && (
              <Row label="Legal name" value={org.legalName} />
            )}
            <Row label="Type">
              <StatusChip tone="neutral">{org.type}</StatusChip>
            </Row>
            <Row label="Country" value={org.country} />
            {org.website && (
              <Row label="Website">
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-3 hover:text-foreground text-muted-foreground"
                >
                  {org.website}
                </a>
              </Row>
            )}
            {org.description && (
              <Row label="Description" value={org.description} />
            )}
            <Row label="Drive folder">
              <FolderLinkField
                kind="organization"
                id={org.id}
                folderName={org.googleDriveFolderName}
                folderUrl={org.googleDriveFolderUrl}
                canManage={canManage}
              />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Contacts ({org.contacts.length})
            </CardTitle>
            <CreateContactDialog defaultOrgId={org.id} />
          </CardHeader>
          <CardContent>
            {org.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts yet.</p>
            ) : (
              <div className="divide-y divide-dotted divide-border">
                {org.contacts.map((c) => (
                  <div key={c.id} className="py-2">
                    <Link
                      href={`/contacts/${c.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {c.fullName}
                    </Link>
                    {c.title && (
                      <p className="text-xs text-muted-foreground">{c.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {org.initiatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Initiatives ({org.initiatives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {org.initiatives.map((init) => (
                <div
                  key={init.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <div>
                    <Link
                      href={`/initiatives/${init.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {init.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{init.country}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StageBadge stage={init.stage} />
                    <span className="text-xs text-muted-foreground">
                      {init.assignedAl.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Documents ({org.documents.length})
          </CardTitle>
          {canManage && (
            <LinkDriveButton
              target={{
                kind: "organization",
                organizationId: org.id,
                type: "INSTITUTIONAL_DECK",
              }}
              allowTypeChange
            />
          )}
        </CardHeader>
        <CardContent>
          <DocumentList documents={org.documents} canManage={canManage} />
        </CardContent>
      </Card>
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
