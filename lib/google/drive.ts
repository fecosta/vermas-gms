// Google Drive API v3 — server-side wrapper.
// Ported from the standalone velezreyes-drive-search tool (src/utils/driveApi.js),
// rewired to take a server-held OAuth access token instead of a browser token.
// Never call these from the client; the token must stay server-side.

const DRIVE_API = "https://www.googleapis.com/drive/v3";

export type DriveOwner = {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
};

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  createdTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  owners?: DriveOwner[];
  parents?: string[];
  lastModifyingUser?: DriveOwner;
  starred?: boolean;
};

type Params = Record<string, string | number | boolean | undefined>;

async function driveRequest<T>(
  endpoint: string,
  token: string,
  params: Params = {}
): Promise<T> {
  const url = new URL(`${DRIVE_API}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Drive API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type SearchOptions = {
  sharedDriveId: string;
  query?: string;
  folderId?: string;
  mimeType?: string;
  owner?: string;
  modifiedAfter?: string;
  modifiedBefore?: string;
  pageToken?: string;
  pageSize?: number;
  orderBy?: string;
};

const FILE_FIELDS =
  "id, name, mimeType, modifiedTime, size, webViewLink, iconLink, owners, parents, createdTime, lastModifyingUser, starred";

/** Search files in the Shared Drive. Returns a page of files + a next-page token. */
export async function searchFiles(
  token: string,
  options: SearchOptions
): Promise<{ files: DriveFile[]; nextPageToken: string | null }> {
  const {
    sharedDriveId,
    query,
    folderId,
    mimeType,
    owner,
    modifiedAfter,
    modifiedBefore,
    pageToken,
    pageSize = 50,
    orderBy = "modifiedTime desc",
  } = options;

  const conditions = ["trashed = false"];

  if (query) {
    // fullText covers name + content for Google Docs/Sheets/Slides
    conditions.push(`fullText contains '${query.replace(/'/g, "\\'")}'`);
  }
  if (folderId) {
    conditions.push(`'${folderId}' in parents`);
  }
  if (mimeType) {
    if (mimeType === "folder") {
      conditions.push(`mimeType = 'application/vnd.google-apps.folder'`);
    } else if (mimeType === "document") {
      conditions.push(
        `(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`
      );
    } else if (mimeType === "spreadsheet") {
      conditions.push(
        `(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')`
      );
    } else if (mimeType === "presentation") {
      conditions.push(
        `(mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation')`
      );
    } else if (mimeType === "image") {
      conditions.push(`mimeType contains 'image/'`);
    } else {
      conditions.push(`mimeType = '${mimeType}'`);
    }
  }
  if (owner) {
    conditions.push(`'${owner}' in owners`);
  }
  if (modifiedAfter) {
    conditions.push(`modifiedTime > '${modifiedAfter}'`);
  }
  if (modifiedBefore) {
    conditions.push(`modifiedTime < '${modifiedBefore}'`);
  }

  const result = await driveRequest<{
    files?: DriveFile[];
    nextPageToken?: string;
  }>("/files", token, {
    q: conditions.join(" and "),
    corpora: "drive",
    driveId: sharedDriveId,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    fields: `nextPageToken, files(${FILE_FIELDS})`,
    pageSize,
    pageToken,
    orderBy,
  });

  return {
    files: result.files || [],
    nextPageToken: result.nextPageToken || null,
  };
}

/** Fetch a single file's metadata (used to cache authoritative metadata on link). */
export async function getFile(token: string, fileId: string): Promise<DriveFile> {
  return driveRequest<DriveFile>(`/files/${fileId}`, token, {
    supportsAllDrives: true,
    fields: FILE_FIELDS,
  });
}

/** Top-level folders in the Shared Drive (for the area filter). */
export async function listTopFolders(
  token: string,
  sharedDriveId: string
): Promise<{ id: string; name: string }[]> {
  const result = await driveRequest<{ files?: { id: string; name: string }[] }>(
    "/files",
    token,
    {
      q: `'${sharedDriveId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      corpora: "drive",
      driveId: sharedDriveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields: "files(id, name)",
      pageSize: 50,
      orderBy: "name",
    }
  );
  return result.files || [];
}

export type DriveOwnerSummary = { email: string; name: string; photoLink: string | null };

/** Sample recent files to extract a unique owner list (for the owner filter). */
export async function listOwners(
  token: string,
  sharedDriveId: string
): Promise<DriveOwnerSummary[]> {
  const result = await searchFiles(token, {
    sharedDriveId,
    pageSize: 100,
    orderBy: "modifiedTime desc",
  });

  const owners = new Map<string, DriveOwnerSummary>();
  const add = (o?: DriveOwner) => {
    if (o?.emailAddress && !owners.has(o.emailAddress)) {
      owners.set(o.emailAddress, {
        email: o.emailAddress,
        name: o.displayName || o.emailAddress,
        photoLink: o.photoLink || null,
      });
    }
  };
  for (const file of result.files) {
    file.owners?.forEach(add);
    add(file.lastModifyingUser);
  }

  return Array.from(owners.values()).sort((a, b) => a.name.localeCompare(b.name));
}
