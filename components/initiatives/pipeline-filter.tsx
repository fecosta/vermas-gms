"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineBoard } from "./pipeline-board";
import { InitiativeTable } from "./initiative-table";
import { STAGE_LABELS } from "@/components/shared/stage-badge";
import { STAGE_ORDER } from "@/lib/workflow";
import type { InitiativeRow } from "@/lib/db/initiatives";

interface Props {
  initiatives: InitiativeRow[];
}

export function PipelineFilter({ initiatives }: Props) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("__all__");

  const filtered = initiatives.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      i.name.toLowerCase().includes(q) ||
      (i.organization?.name ?? "").toLowerCase().includes(q) ||
      i.country.toLowerCase().includes(q);
    const matchStage = stage === "__all__" || i.stage === stage;
    return matchSearch && matchStage;
  });

  const isFiltered = search !== "" || stage !== "__all__";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by name, org, country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select
          value={stage}
          onValueChange={(v: string | null) => setStage(v ?? "__all__")}
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All stages</SelectItem>
            {STAGE_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFiltered && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} of {initiatives.length}
          </span>
        )}
      </div>
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          <PipelineBoard initiatives={filtered} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <InitiativeTable initiatives={filtered} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
