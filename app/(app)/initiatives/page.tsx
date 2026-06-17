import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getInitiatives } from "@/lib/db/initiatives";
import { getAreas } from "@/lib/db/areas";
import { getOrganizations } from "@/lib/db/organizations";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineBoard } from "@/components/initiatives/pipeline-board";
import { InitiativeTable } from "@/components/initiatives/initiative-table";
import { CreateInitiativeDialog } from "@/components/initiatives/create-initiative-dialog";

export default async function InitiativesPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const [initiatives, areas, orgs] = await Promise.all([
    getInitiatives(user),
    getAreas(),
    getOrganizations(),
  ]);

  const orgOptions = orgs.map((o) => ({ id: o.id, name: o.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description={`${initiatives.length} initiative${initiatives.length !== 1 ? "s" : ""}`}
        action={
          <CreateInitiativeDialog
            user={user}
            areas={areas}
            organizations={orgOptions}
          />
        }
      />

      {initiatives.length === 0 ? (
        <EmptyState
          title="No initiatives yet"
          description="Create your first initiative to start tracking the pipeline."
          action={
            <CreateInitiativeDialog
              user={user}
              areas={areas}
              organizations={orgOptions}
            />
          }
        />
      ) : (
        <Tabs defaultValue="board">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="mt-4">
            <PipelineBoard initiatives={initiatives} />
          </TabsContent>
          <TabsContent value="list" className="mt-4">
            <InitiativeTable initiatives={initiatives} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
