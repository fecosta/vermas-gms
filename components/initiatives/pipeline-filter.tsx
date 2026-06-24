"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { PipelineBoard } from "./pipeline-board";
import { InitiativeTable } from "./initiative-table";
import { COLUMN_ORDER, columnForStage } from "@/lib/workflow";
import type { InitiativeRow } from "@/lib/db/initiatives";
import type { Priority } from "@/app/generated/prisma/enums";

const PRIORITIES: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];
const PRIORITY_LABEL: Record<Priority, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

interface Props {
  initiatives: InitiativeRow[];
}

export function PipelineFilter({ initiatives }: Props) {
  const [search, setSearch] = useState("");
  const [column, setColumn] = useState("__all__");
  const [area, setArea] = useState("__all__");
  const [priority, setPriority] = useState("__all__");
  const [view, setView] = useState<"board" | "list">("board");

  const areaOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of initiatives) if (i.area) m.set(i.area.id, i.area.name);
    return Array.from(m, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [initiatives]);

  const filtered = initiatives.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      i.name.toLowerCase().includes(q) ||
      (i.organization?.name ?? "").toLowerCase().includes(q) ||
      i.country.toLowerCase().includes(q);
    const matchColumn = column === "__all__" || columnForStage(i.stage) === column;
    const matchArea = area === "__all__" || i.area?.id === area;
    const matchPriority = priority === "__all__" || i.priority === priority;
    return matchSearch && matchColumn && matchArea && matchPriority;
  });

  const isFiltered =
    search !== "" || column !== "__all__" || area !== "__all__" || priority !== "__all__";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[200px] max-w-xs flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <SearchIcon className="size-4 shrink-0 text-faint" />
          <input
            placeholder="Search initiatives…"
            aria-label="Search initiatives"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Select value={area} onValueChange={(v: string | null) => setArea(v ?? "__all__")}>
          <SelectTrigger className="h-9 w-auto min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All areas</SelectItem>
            {areaOptions.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priority}
          onValueChange={(v: string | null) => setPriority(v ?? "__all__")}
        >
          <SelectTrigger className="h-9 w-auto min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={column} onValueChange={(v: string | null) => setColumn(v ?? "__all__")}>
          <SelectTrigger className="h-9 w-auto min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All columns</SelectItem>
            {COLUMN_ORDER.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SegmentedToggle<"board" | "list">
          aria-label="View"
          value={view}
          onValueChange={setView}
          options={[
            { value: "board", label: "Board" },
            { value: "list", label: "List" },
          ]}
        />

        {isFiltered && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} of {initiatives.length}
          </span>
        )}
      </div>

      {view === "board" ? (
        <PipelineBoard initiatives={filtered} />
      ) : (
        <InitiativeTable initiatives={filtered} />
      )}
    </div>
  );
}
