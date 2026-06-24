import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google/auth";
import { searchFiles } from "@/lib/google/drive";

export const dynamic = "force-dynamic";

// Server-side Drive search. The user's Google token is read from the session
// cookie here and never reaches the browser. Google enforces per-user access.
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

  const sp = req.nextUrl.searchParams;
  try {
    const result = await searchFiles(token, {
      sharedDriveId,
      query: sp.get("q") || undefined,
      folderId: sp.get("folderId") || undefined,
      mimeType: sp.get("mimeType") || undefined,
      owner: sp.get("owner") || undefined,
      modifiedAfter: sp.get("modifiedAfter") || undefined,
      modifiedBefore: sp.get("modifiedBefore") || undefined,
      pageToken: sp.get("pageToken") || undefined,
      orderBy: sp.get("orderBy") || undefined,
      pageSize: 50,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Drive search failed." },
      { status: 502 }
    );
  }
}
