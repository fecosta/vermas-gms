import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/db/client";
import type { Role } from "@/app/generated/prisma/enums";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  areaId: string | null;
};

const WORKSPACE_DOMAIN = process.env.GOOGLE_WORKSPACE_DOMAIN;
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Exchange the stored refresh token for a fresh Google access token.
 * Google does not always return a new refresh token, so we keep the old one.
 */
async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };
    if (!res.ok || !data.access_token) throw new Error("refresh_failed");

    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    // Surface a recoverable error; the next sign-in re-issues tokens.
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // offline + consent so Google returns a refresh token we can reuse for Drive
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.readonly",
          // restrict the account chooser to the Workspace org (hardened in signIn below)
          ...(WORKSPACE_DOMAIN ? { hd: WORKSPACE_DOMAIN } : {}),
        },
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h — role changes take effect at next login
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      if (!email) return false;

      // Defence in depth: enforce the Workspace domain even if `hd` was tampered with.
      if (WORKSPACE_DOMAIN) {
        const hd = (profile as { hd?: string }).hd;
        const domain = email.split("@")[1];
        if (hd !== WORKSPACE_DOMAIN && domain !== WORKSPACE_DOMAIN) return false;
      }

      // Only known, active GMS users may sign in. Deactivating a user revokes access.
      // Surface DB/connectivity errors instead of letting them collapse into a silent AccessDenied.
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, isActive: true },
        });
        return Boolean(dbUser && dbUser.isActive);
      } catch (e) {
        console.error("[signin] user lookup failed:", e instanceof Error ? e.message : String(e));
        throw e;
      }
    },
    async jwt({ token, account, profile }) {
      // Initial sign-in: persist Google tokens and graft the GMS identity onto the JWT.
      if (account && profile?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { id: true, role: true, areaId: true },
        });
        if (dbUser) {
          token.id = dbUser.id; // our cuid, not the Google `sub`
          token.role = dbUser.role;
          token.areaId = dbUser.areaId;
        }
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // epoch seconds
        return token;
      }

      // Still valid (with a 60s safety margin) — reuse as-is.
      if (token.expiresAt && Date.now() < ((token.expiresAt as number) - 60) * 1000) {
        return token;
      }

      // Expired — refresh if we can; this re-persists to the cookie.
      if (token.refreshToken) {
        return refreshGoogleAccessToken(token);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as SessionUser).role = token.role as Role;
        (session.user as unknown as SessionUser).areaId =
          (token.areaId as string) ?? null;
      }
      // Google access/refresh tokens are deliberately NOT exposed to the client here.
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
