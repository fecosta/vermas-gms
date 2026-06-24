import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google/auth";
import { listTopFolders, listOwners } from "@/lib/google/drive";

export const dynamic = "force-dynamic";

// Folder + owner lists that populate the Drive search filters.
export async function GET(req: NextRequest) {
  const sharedDriveId = process.env.GOOGLE_SHARED_DRIVE_ID;
  if (!sharedDriveId) {
    return NextResponse.json(
      { error: "Drive search is not configured (missing GOOGLE_SHARED_DRIVE_ID)." },
      { status: 500 }
    );
  }

  const token = await getGoogleAccessToken(req);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const [topFolders, owners] = await Promise.all([
      listTopFolders(token, sharedDriveId),
      listOwners(token, sharedDriveId),
    ]);
    return NextResponse.json({ topFolders, owners });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load Drive metadata." },
      { status: 502 }
    );
  }
}
