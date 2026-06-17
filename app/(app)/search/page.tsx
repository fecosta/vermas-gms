import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StageBadge } from "@/components/shared/stage-badge";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const trimmed = q?.trim() ?? "";

  if (!trimmed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Search" description="Search across initiatives, organizations, and contacts" />
        <EmptyState title="Enter a search term" description="Type in the search box in the nav to get started." />
      </div>
    );
  }

  const term = { contains: trimmed, mode: "insensitive" as const };

  const [initiatives, orgs, contacts] = await Promise.all([
    prisma.initiative.findMany({
      where: { OR: [{ name: term }, { summary: term }, { country: term }] },
      select: {
        id: true,
        name: true,
        stage: true,
        country: true,
        assignedAl: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.organization.findMany({
      where: { OR: [{ name: term }, { country: term }] },
      select: { id: true, name: true, country: true, type: true },
      orderBy: { name: "asc" },
      take: 10,
    }),
    prisma.contact.findMany({
      where: { OR: [{ fullName: term }, { email: term }] },
      select: { id: true, fullName: true, email: true, title: true },
      orderBy: { fullName: "asc" },
      take: 10,
    }),
  ]);

  const hasResults =
    initiatives.length > 0 || orgs.length > 0 || contacts.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Search results"
        description={`"${trimmed}"`}
      />

      {!hasResults && (
        <EmptyState
          title={`No results for "${trimmed}"`}
          description="Try a different search term."
        />
      )}

      {initiatives.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Initiatives ({initiatives.length})
          </h2>
          <div className="divide-y border rounded-lg">
            {initiatives.map((i) => (
              <Link
                key={i.id}
                href={`/initiatives/${i.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {i.country}
                    {i.assignedAl ? ` · ${i.assignedAl.name}` : ""}
                  </p>
                </div>
                <StageBadge stage={i.stage} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {orgs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Organizations ({orgs.length})
          </h2>
          <div className="divide-y border rounded-lg">
            {orgs.map((o) => (
              <Link
                key={o.id}
                href={`/organizations/${o.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{o.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.country}
                    {o.type ? ` · ${o.type}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contacts ({contacts.length})
          </h2>
          <div className="divide-y border rounded-lg">
            {contacts.map((c) => (
              <Link
                key={c.id}
                href={`/contacts/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{c.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.email}
                    {c.title ? ` · ${c.title}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
