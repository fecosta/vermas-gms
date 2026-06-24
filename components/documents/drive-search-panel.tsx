"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DriveFile } from "@/lib/google/drive";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  formatDate,
  formatSize,
  getFileColor,
  getFileType,
} from "@/lib/google/helpers";

const FILE_TYPES = [
  { key: "document", label: "Docs" },
  { key: "spreadsheet", label: "Sheets" },
  { key: "presentation", label: "Slides" },
  { key: "application/pdf", label: "PDF" },
  { key: "image", label: "Images" },
];

type Folder = { id: string; name: string };
type Owner = { email: string; name: string };

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-foreground/30"
      }`}
    >
      {label}
    </button>
  );
}

export function DriveSearchPanel({
  foldersOnly = false,
  pending = false,
  onPick,
}: {
  foldersOnly?: boolean;
  pending?: boolean;
  onPick: (file: DriveFile) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [dateAfter, setDateAfter] = useState("");
  const [dateBefore, setDateBefore] = useState("");
  const [sortBy, setSortBy] = useState("modifiedTime desc");

  const [results, setResults] = useState<DriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topFolders, setTopFolders] = useState<Folder[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);

  const searchId = useRef(0);

  // Filter metadata (folders + owners) loaded once.
  useEffect(() => {
    fetch("/api/drive/meta")
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          setError(d.error);
          return;
        }
        setTopFolders(d.topFolders ?? []);
        setOwners(d.owners ?? []);
      })
      .catch(() => {});
  }, []);

  const runSearch = useCallback(
    async (opts: { pageToken?: string } = {}) => {
      const id = ++searchId.current;
      const isMore = !!opts.pageToken;
      if (!isMore) setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const effectiveType = foldersOnly ? "folder" : type;
      if (effectiveType) params.set("mimeType", effectiveType);
      if (folder) params.set("folderId", folder.id);
      if (owner) params.set("owner", owner);
      if (dateAfter) params.set("modifiedAfter", `${dateAfter}T00:00:00`);
      if (dateBefore) params.set("modifiedBefore", `${dateBefore}T23:59:59`);
      params.set("orderBy", sortBy);
      if (opts.pageToken) params.set("pageToken", opts.pageToken);

      try {
        const res = await fetch(`/api/drive/search?${params.toString()}`);
        const data = await res.json();
        if (id !== searchId.current) return;
        if (!res.ok) {
          setError(data?.error || "Drive search failed.");
          if (!isMore) setResults([]);
          return;
        }
        setResults((prev) =>
          isMore ? [...prev, ...(data.files ?? [])] : data.files ?? []
        );
        setNextPageToken(data.nextPageToken ?? null);
      } catch {
        if (id === searchId.current) setError("Drive search failed.");
      } finally {
        if (id === searchId.current) setLoading(false);
      }
    },
    [query, type, folder, owner, dateAfter, dateBefore, sortBy, foldersOnly]
  );

  // Debounced search whenever the query or any filter changes (and on mount).
  useEffect(() => {
    const t = setTimeout(() => runSearch(), 350);
    return () => clearTimeout(t);
  }, [runSearch]);

  return (
    <div className="space-y-3">
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={foldersOnly ? "Search folders…" : "Search Drive (name + contents)…"}
      />

      {!foldersOnly && (
        <div className="flex flex-wrap gap-1.5">
          {FILE_TYPES.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              active={type === t.key}
              onClick={() => setType(type === t.key ? null : t.key)}
            />
          ))}
        </div>
      )}

      {topFolders.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topFolders.map((f) => (
            <Chip
              key={f.id}
              label={f.name.replace(/^\d+_/, "").replace(/_/g, " ")}
              active={folder?.id === f.id}
              onClick={() => setFolder(folder?.id === f.id ? null : f)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {owners.length > 0 && (
          <select
            value={owner ?? ""}
            onChange={(e) => setOwner(e.target.value || null)}
            className="h-7 rounded-md border bg-background px-2 text-xs"
          >
            <option value="">Any owner</option>
            {owners.map((o) => (
              <option key={o.email} value={o.email}>
                {o.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={dateAfter}
          onChange={(e) => setDateAfter(e.target.value)}
          className="h-7 rounded-md border bg-background px-2 text-xs"
          aria-label="Modified after"
        />
        <input
          type="date"
          value={dateBefore}
          onChange={(e) => setDateBefore(e.target.value)}
          className="h-7 rounded-md border bg-background px-2 text-xs"
          aria-label="Modified before"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="ml-auto h-7 rounded-md border bg-background px-2 text-xs"
        >
          <option value="modifiedTime desc">Newest</option>
          <option value="modifiedTime asc">Oldest</option>
          <option value="name asc">Name A→Z</option>
          <option value="name desc">Name Z→A</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="max-h-80 divide-y overflow-y-auto rounded-md border">
        {loading && results.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No files found.</p>
        ) : (
          results.map((file) => (
            <button
              key={file.id}
              type="button"
              disabled={pending}
              onClick={() => onPick(file)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 disabled:opacity-50"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: getFileColor(file.mimeType) }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{file.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {getFileType(file.mimeType)}
                  {file.owners?.[0]?.displayName ? ` · ${file.owners[0].displayName}` : ""}
                  {file.modifiedTime ? ` · ${formatDate(file.modifiedTime)}` : ""}
                  {file.size ? ` · ${formatSize(file.size)}` : ""}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      {nextPageToken && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => runSearch({ pageToken: nextPageToken })}
          className="w-full"
        >
          {loading ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
