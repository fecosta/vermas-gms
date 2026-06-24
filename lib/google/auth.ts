import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

// SERVER ONLY. Reads the per-user Google token out of the encrypted session JWT.
// Never import this into a client component.

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type ReqLike = Request | { headers: Headers | Record<string, string> };

/**
 * Returns a valid Google access token for the signed-in user, or `null` if there
 * is no usable token. The token is read from the httpOnly session cookie and
 * decrypted server-side — it is never exposed to the browser.
 *
 * Pass `req` inside a Route Handler; in a Server Action / Server Component it
 * falls back to the request's headers automatically.
 *
 * Refresh here is best-effort for the current request. The `jwt` callback in
 * `lib/auth` performs the authoritative refresh-and-persist on the next `auth()`.
 */
export async function getGoogleAccessToken(
  req?: ReqLike
): Promise<string | null> {
  const request: ReqLike =
    req ?? { headers: Object.fromEntries((await headers()).entries()) };
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token) return null;

  const accessToken = token.accessToken as string | undefined;
  const refreshToken = token.refreshToken as string | undefined;
  const expiresAt = token.expiresAt as number | undefined;

  // Still valid (60s safety margin).
  if (accessToken && expiresAt && Date.now() < (expiresAt - 60) * 1000) {
    return accessToken;
  }

  if (!refreshToken) return accessToken ?? null;

  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return accessToken ?? null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? accessToken ?? null;
  } catch {
    return accessToken ?? null;
  }
}
