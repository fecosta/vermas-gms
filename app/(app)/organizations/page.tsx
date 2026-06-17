import { getOrganizations } from "@/lib/db/organizations";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { OrganizationTable } from "@/components/organizations/organization-table";
import { CreateOrganizationDialog } from "@/components/organizations/organization-dialog";

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="All grantee and prospect organizations."
        action={<CreateOrganizationDialog />}
      />
      {organizations.length === 0 ? (
        <EmptyState
          title="No organizations yet"
          description="Add your first organization to get started."
          action={<CreateOrganizationDialog />}
        />
      ) : (
        <OrganizationTable organizations={organizations} />
      )}
    </div>
  );
}
