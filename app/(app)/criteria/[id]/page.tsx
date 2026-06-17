import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getCriteriaSet } from "@/lib/db/criteria";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateCriteriaSet, addCriteriaItem } from "@/app/actions/criteria";
import { ChevronLeftIcon } from "lucide-react";
import { DeleteItemButton } from "@/app/(app)/criteria/[id]/delete-item-button";
import { CriteriaEditForm } from "@/app/(app)/criteria/[id]/criteria-edit-form";
import { AddItemForm } from "@/app/(app)/criteria/[id]/add-item-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CriteriaSetPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "criteria:manage")) redirect("/dashboard");

  let set;
  try {
    set = await getCriteriaSet(id);
  } catch {
    notFound();
  }

  const boundUpdate = updateCriteriaSet.bind(null, id);
  const boundAddItem = addCriteriaItem.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/criteria" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to criteria
        </Button>
        <PageHeader
          title={set.name}
          description={`Used by ${set._count.initiatives} initiative${set._count.initiatives !== 1 ? "s" : ""}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Criteria items</CardTitle>
            </CardHeader>
            <CardContent>
              {set.items.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-4">No items yet. Add the first one below.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Guidance</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {set.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm text-muted-foreground">{item.order}</TableCell>
                        <TableCell className="text-sm font-medium">{item.label}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.guidance ?? "—"}</TableCell>
                        <TableCell>
                          <DeleteItemButton itemId={item.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Add item</CardTitle>
            </CardHeader>
            <CardContent>
              <AddItemForm action={boundAddItem} nextOrder={set.items.length} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Edit details</CardTitle>
            </CardHeader>
            <CardContent>
              <CriteriaEditForm
                action={boundUpdate}
                defaultName={set.name}
                defaultDescription={set.description ?? ""}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
