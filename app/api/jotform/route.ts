import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

// Public endpoint — no session. Protected by a shared secret appended to the
// webhook URL (?secret=) or sent as the x-jotform-secret header.

function extractContact(raw: Record<string, unknown>): {
  name?: string;
  email?: string;
} {
  let email: string | undefined;
  let name: string | undefined;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const [k, v] of Object.entries(raw)) {
    const key = k.toLowerCase();
    if (!email && typeof v === "string" && key.includes("email") && emailRe.test(v.trim())) {
      email = v.trim();
    }
    if (!name && key.includes("name")) {
      if (typeof v === "string" && v.trim()) {
        name = v.trim();
      } else if (v && typeof v === "object") {
        // Jotform name fields arrive as { first, last }
        const o = v as Record<string, string>;
        const parts = [o.first, o.last].filter(Boolean);
        if (parts.length) name = parts.join(" ");
      }
    }
  }
  // Fallback: any value that looks like an email.
  if (!email) {
    for (const v of Object.values(raw)) {
      if (typeof v === "string" && emailRe.test(v.trim())) {
        email = v.trim();
        break;
      }
    }
  }
  return { name, email };
}

export async function POST(req: NextRequest) {
  const secret = process.env.JOTFORM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured (missing JOTFORM_WEBHOOK_SECRET)." },
      { status: 500 }
    );
  }

  const provided =
    req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-jotform-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Jotform posts multipart/form-data; fall back to JSON.
  let fields: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") fields[k] = v;
    }
  } catch {
    try {
      fields = (await req.json()) as Record<string, string>;
    } catch {
      return NextResponse.json({ error: "Unparseable payload." }, { status: 400 });
    }
  }

  const submissionId = fields.submissionID || fields.submissionId;
  if (!submissionId) {
    return NextResponse.json({ error: "Missing submissionID." }, { status: 400 });
  }

  // Prefer the full answer set (rawRequest) for rawJson; fall back to all fields.
  let rawObj: Record<string, unknown> = { ...fields };
  if (fields.rawRequest) {
    try {
      const parsed = JSON.parse(fields.rawRequest);
      if (parsed && typeof parsed === "object") rawObj = parsed as Record<string, unknown>;
    } catch {
      /* keep the flat fields */
    }
  }

  const { name, email } = extractContact(rawObj);
  const formId = fields.formID || fields.formId || null;
  const submissionUrl = formId
    ? `https://www.jotform.com/inbox/${formId}/${submissionId}`
    : `https://www.jotform.com/submission/${submissionId}`;

  // Idempotent: ignore duplicate deliveries of the same submission.
  const existing = await prisma.applicationIntake.findUnique({
    where: { jotformSubmissionId: submissionId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, intakeId: existing.id, duplicate: true });
  }

  const intake = await prisma.applicationIntake.create({
    data: {
      jotformFormId: formId,
      jotformSubmissionId: submissionId,
      submissionUrl,
      submittedByName: name ?? null,
      submittedByEmail: email ?? null,
      submittedAt: new Date(),
      rawJson: rawObj as unknown as Prisma.InputJsonValue,
      status: "NEEDS_TRIAGE",
    },
  });

  // Alert the triage owners (AL + ADMIN).
  const triagers = await prisma.user.findMany({
    where: { role: { in: ["AL", "ADMIN"] }, isActive: true },
    select: { id: true },
  });
  if (triagers.length > 0) {
    await prisma.notification.createMany({
      data: triagers.map((u) => ({
        userId: u.id,
        type: "APPLICATION_RECEIVED" as const,
        message: `New application received via Jotform${name ? ` from ${name}` : ""} — needs triage`,
        relatedType: "INTAKE",
        relatedId: intake.id,
      })),
    });
  }

  return NextResponse.json({ ok: true, intakeId: intake.id });
}
