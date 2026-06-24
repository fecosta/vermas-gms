"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function LoginInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const hasError = searchParams.get("error") !== null;

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      {/* Brand side */}
      <div className="relative flex flex-col justify-between gap-10 overflow-hidden bg-panel p-8 text-panel-foreground sm:p-12 md:min-h-screen">
        <div className="font-serif text-2xl">
          Vélez<span className="opacity-85">Reyes</span>
          <span className="text-yellow">+</span>
        </div>
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow">
            Grant management system
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-5xl">
            From first conversation to active grant — one place.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Source, assess, decide, and steward every initiative across the portfolio. Built
            for the people who move capital toward impact.
          </p>
        </div>
        <p className="text-xs text-white/40">© 2026 VélezReyes+ · Internal use only</p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-20 size-64 rounded-full border-2 border-dotted border-white/10"
        />
      </div>

      {/* Sign-in side */}
      <div className="flex flex-col items-center justify-center bg-background p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Welcome back
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">Sign in</h2>
          <p className="mt-1.5 mb-6 text-sm leading-relaxed text-muted-foreground">
            Use your organization account. Access is granted by role.
          </p>

          {hasError && (
            <p className="mb-4 rounded-lg border border-dotted border-border bg-[color-mix(in_srgb,var(--danger)_10%,white)] px-3 py-2 text-sm text-danger-deep">
              That account doesn’t have access to GMS. Contact an administrator.
            </p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              signIn("google", { callbackUrl: "/dashboard" });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-white">
              <GoogleIcon />
            </span>
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="my-6 border-t border-dotted border-border" />
          <p className="text-center text-xs leading-relaxed text-faint">
            Trouble signing in? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
