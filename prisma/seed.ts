import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ----------------------------------------------------------------
  // Areas
  // ----------------------------------------------------------------
  const education = await prisma.area.upsert({
    where: { id: "area-education" },
    update: {},
    create: { id: "area-education", name: "Education", description: "Education initiatives across Latin America" },
  });
  const democracy = await prisma.area.upsert({
    where: { id: "area-democracy" },
    update: {},
    create: { id: "area-democracy", name: "Democracy", description: "Democracy and governance initiatives" },
  });

  // ----------------------------------------------------------------
  // Users — one per role
  // ----------------------------------------------------------------
  const password = await bcrypt.hash("Vermas2025!", 12);

  const users = [
    { id: "user-ceo",        email: "ceo@vermas.org",         name: "Carolina Reyes",   role: "CEO"          as const, areaId: null },
    { id: "user-kmd",        email: "kmd@vermas.org",         name: "Miguel Torres",    role: "KMD"          as const, areaId: null },
    { id: "user-al-edu",     email: "al.education@vermas.org",name: "Sofía Mendez",     role: "AL"           as const, areaId: education.id },
    { id: "user-al-dem",     email: "al.democracy@vermas.org",name: "Andrés Vega",      role: "AL"           as const, areaId: democracy.id },
    { id: "user-at",         email: "at@vermas.org",          name: "Lucía Campos",     role: "AT"           as const, areaId: education.id },
    { id: "user-ad",         email: "ad@vermas.org",          name: "Roberto Suárez",   role: "AD"           as const, areaId: null },
    { id: "user-tl",         email: "tl@vermas.org",          name: "Felipe Herrera",   role: "TL"           as const, areaId: null },
    { id: "user-reviewer-1", email: "reviewer1@vermas.org",   name: "Ana Castillo",     role: "PEER_REVIEWER"as const, areaId: null },
    { id: "user-reviewer-2", email: "reviewer2@vermas.org",   name: "Martín Díaz",      role: "PEER_REVIEWER"as const, areaId: null },
    { id: "user-admin",      email: "admin@vermas.org",       name: "Valeria Ortega",   role: "ADMIN"        as const, areaId: null },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, passwordHash: password, isActive: true },
    });
  }

  // ----------------------------------------------------------------
  // Organizations & Contacts
  // ----------------------------------------------------------------
  const orgs = [
    { id: "org-fundacion-leer", name: "Fundación Leer", country: "Argentina", type: "NGO" as const },
    { id: "org-democracia-ac",  name: "Democracia A.C.", country: "Mexico",   type: "NGO" as const },
    { id: "org-edtech-co",      name: "EdTech Colombia", country: "Colombia", type: "COMPANY" as const },
    { id: "org-civic-br",       name: "Civic Brasil",    country: "Brazil",   type: "NGO" as const },
    { id: "org-voces",          name: "Voces Ciudadanas",country: "Peru",     type: "NGO" as const },
  ];

  for (const o of orgs) {
    await prisma.organization.upsert({
      where: { id: o.id },
      update: {},
      create: o,
    });
  }

  const contacts = [
    { id: "con-1", fullName: "María Gonzalez",  email: "maria@fundacionleer.org",  organizationId: "org-fundacion-leer" },
    { id: "con-2", fullName: "Jorge Ramírez",   email: "jorge@democraciaac.org",   organizationId: "org-democracia-ac"  },
    { id: "con-3", fullName: "Patricia López",  email: "patricia@edtechco.com",    organizationId: "org-edtech-co"      },
    { id: "con-4", fullName: "Gustavo Morales", email: "gustavo@civicbrasil.org",  organizationId: "org-civic-br"       },
    { id: "con-5", fullName: "Carmen Flores",   email: "carmen@voces.org.pe",      organizationId: "org-voces"          },
  ];

  for (const c of contacts) {
    await prisma.contact.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // ----------------------------------------------------------------
  // Criteria Sets
  // ----------------------------------------------------------------
  const sets = [
    {
      id: "cs-1",
      name: "Set 1 — Strategic Fit",
      description: "Alignment with thematic strategy and investment criteria",
      items: [
        { label: "Alignment with ToC", guidance: "Does the initiative contribute to the theory of change?", order: 1 },
        { label: "Geographic fit", guidance: "Does the initiative operate in priority geographies?", order: 2 },
        { label: "Strategic alignment", guidance: "Does the initiative align with current thematic priorities?", order: 3 },
      ],
    },
    {
      id: "cs-2",
      name: "Set 2 — Solution Strength & Learning Value",
      description: "Quality of the proposed solution and evidence base",
      items: [
        { label: "Evidence base", guidance: "Is there evidence supporting the approach?", order: 1 },
        { label: "Innovation", guidance: "Does the initiative bring a novel approach?", order: 2 },
        { label: "Learning potential", guidance: "Will this generate valuable learnings for the field?", order: 3 },
      ],
    },
    {
      id: "cs-3",
      name: "Set 3 — Execution Capacity & Impact/Scale",
      description: "Organizational capacity and potential for impact at scale",
      items: [
        { label: "Team capacity", guidance: "Does the team have the expertise to deliver?", order: 1 },
        { label: "Scalability", guidance: "Can the model be scaled or replicated?", order: 2 },
        { label: "Financial management", guidance: "Does the org have strong financial controls?", order: 3 },
      ],
    },
  ];

  for (const s of sets) {
    await prisma.criteriaSet.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        description: s.description,
        items: { create: s.items.map(i => ({ ...i, id: `${s.id}-item-${i.order}` })) },
      },
    });
  }

  // ----------------------------------------------------------------
  // Initiatives — spread across stages
  // ----------------------------------------------------------------
  const initiatives = [
    // Sourcing / early
    { id: "init-1", name: "Lectura Temprana AR",       stage: "SOURCED"                      as const, assignedAlId: "user-al-edu", areaId: education.id,  organizationId: "org-fundacion-leer", country: "Argentina" },
    { id: "init-2", name: "Plataforma Cívica MX",      stage: "SCOPING"                      as const, assignedAlId: "user-al-dem", areaId: democracy.id,  organizationId: "org-democracia-ac",  country: "Mexico"    },
    // Screening
    { id: "init-3", name: "EdTech Rural CO",           stage: "SCREENING_MATERIALS_REQUESTED"as const, assignedAlId: "user-al-edu", areaId: education.id,  organizationId: "org-edtech-co",      country: "Colombia"  },
    { id: "init-4", name: "Transparencia BR",          stage: "CONCEPT_REVIEW"               as const, assignedAlId: "user-al-dem", areaId: democracy.id,  organizationId: "org-civic-br",       country: "Brazil"    },
    // Due diligence
    { id: "init-5", name: "Voces Ciudadanas PE",       stage: "APPLICATION_REVIEW"           as const, assignedAlId: "user-al-dem", areaId: democracy.id,  organizationId: "org-voces",          country: "Peru"      },
    { id: "init-6", name: "Escuelas Digitales CO",     stage: "MEMO_DRAFTING"                as const, assignedAlId: "user-al-edu", areaId: education.id,  organizationId: "org-edtech-co",      country: "Colombia"  },
    { id: "init-7", name: "Participación Juvenil MX",  stage: "PEER_REVIEW"                  as const, assignedAlId: "user-al-dem", areaId: democracy.id,  organizationId: "org-democracia-ac",  country: "Mexico"    },
    // Legal DD
    { id: "init-8", name: "Alfabetización Digital AR", stage: "LEGAL_DUE_DILIGENCE"          as const, assignedAlId: "user-al-edu", areaId: education.id,  organizationId: "org-fundacion-leer", country: "Argentina", legalDdStatus: "IN_PROGRESS" as const },
    // Onboarding / Active
    { id: "init-9", name: "Democracia Participativa BR",stage: "ONBOARDING"                  as const, assignedAlId: "user-al-dem", areaId: democracy.id,  organizationId: "org-civic-br",       country: "Brazil"    },
    { id: "init-10",name: "Competencias Siglo XXI PE",  stage: "ACTIVE"                      as const, assignedAlId: "user-al-edu", areaId: education.id,  organizationId: "org-voces",          country: "Peru",      onboardingStatus: "COMPLETED" as const },
    // CEO review
    { id: "init-11",name: "Elecciones Libres CO",       stage: "CEO_COMMITTEE_REVIEW"         as const, assignedAlId: "user-al-dem", areaId: democracy.id,  organizationId: "org-democracia-ac",  country: "Colombia"  },
    // Concept decision
    { id: "init-12",name: "Primera Infancia MX",        stage: "CONCEPT_DECISION"             as const, assignedAlId: "user-al-edu", areaId: education.id,  organizationId: "org-fundacion-leer", country: "Mexico", ceoDecisionStatus: "APPROVED" as const },
  ];

  for (const init of initiatives) {
    const { id, name, stage, assignedAlId, areaId, organizationId, country, ...rest } = init;
    await prisma.initiative.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name,
        stage,
        assignedAlId,
        areaId,
        organizationId,
        country,
        summary: `${name} is a high-potential initiative working to improve outcomes across the region through evidence-based, scalable solutions that align with our thematic priorities and theory of change.`,
        ...rest,
      },
    });
  }

  // ----------------------------------------------------------------
  // Workflow records — Applications, Memos, Legal DD, Grants
  // (one block per later-stage initiative; all upserts are idempotent)
  // ----------------------------------------------------------------
  const past1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const past2 = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);

  // Helper: upsert PeerReview only if not already present
  async function upsertPeerReview(id: string, memoId: string, reviewerId: string, status: "ASSIGNED" | "COMPLETE", reviewText?: string) {
    const exists = await prisma.peerReview.findFirst({ where: { memoId, reviewerId } });
    if (!exists) {
      await prisma.peerReview.create({
        data: {
          id,
          memoId,
          reviewerId,
          status,
          assignedDate: past2,
          ...(status === "COMPLETE" ? { completedDate: past1, reviewText: reviewText ?? "Review completed." } : {}),
        },
      });
    }
  }

  // ---- init-5: APPLICATION_REVIEW (Voces Ciudadanas PE) ----
  const app5 = await prisma.application.upsert({
    where: { initiativeId: "init-5" },
    update: {},
    create: { id: "app-5", initiativeId: "init-5", organizationId: "org-voces", alId: "user-al-dem", status: "IN_REVIEW" },
  });
  await prisma.applicationReviewReport.upsert({
    where: { applicationId: app5.id },
    update: {},
    create: { id: "report-5", applicationId: app5.id, status: "IN_PROGRESS" },
  });

  // ---- init-6: MEMO_DRAFTING (Escuelas Digitales CO) ----
  const app6 = await prisma.application.upsert({
    where: { initiativeId: "init-6" },
    update: {},
    create: { id: "app-6", initiativeId: "init-6", organizationId: "org-edtech-co", alId: "user-al-edu", status: "COMPLETE" },
  });
  const report6 = await prisma.applicationReviewReport.upsert({
    where: { applicationId: app6.id },
    update: {},
    create: { id: "report-6", applicationId: app6.id, status: "KMD_SIGNED", alSignOffAt: past2, kmdReviewerId: "user-kmd", kmdSignOffAt: past1 },
  });
  await prisma.investmentMemo.upsert({
    where: { reviewReportId: report6.id },
    update: {},
    create: {
      id: "memo-6",
      reviewReportId: report6.id,
      authorAlId: "user-al-edu",
      reviewStatus: "DRAFT",
      body: "Escuelas Digitales CO proposes a scalable EdTech solution for rural schools in Colombia. Their evidence-based approach demonstrates strong alignment with our theory of change and thematic priorities in education access and quality.",
    },
  });

  // ---- init-7: PEER_REVIEW (Participación Juvenil MX) ----
  const app7 = await prisma.application.upsert({
    where: { initiativeId: "init-7" },
    update: {},
    create: { id: "app-7", initiativeId: "init-7", organizationId: "org-democracia-ac", alId: "user-al-dem", status: "COMPLETE" },
  });
  const report7 = await prisma.applicationReviewReport.upsert({
    where: { applicationId: app7.id },
    update: {},
    create: { id: "report-7", applicationId: app7.id, status: "KMD_SIGNED", alSignOffAt: past2, kmdReviewerId: "user-kmd", kmdSignOffAt: past1 },
  });
  const memo7 = await prisma.investmentMemo.upsert({
    where: { reviewReportId: report7.id },
    update: {},
    create: {
      id: "memo-7",
      reviewReportId: report7.id,
      authorAlId: "user-al-dem",
      reviewStatus: "IN_PEER_REVIEW",
      body: "Participación Juvenil MX seeks to strengthen youth civic participation through digital tools and community organizing. The initiative has demonstrated results in two municipalities and has a credible scale-up plan.",
    },
  });
  await upsertPeerReview("pr-7-1", memo7.id, "user-reviewer-1", "ASSIGNED");
  await upsertPeerReview("pr-7-2", memo7.id, "user-reviewer-2", "ASSIGNED");

  // ---- init-11: CEO_COMMITTEE_REVIEW (Elecciones Libres CO) ----
  const app11 = await prisma.application.upsert({
    where: { initiativeId: "init-11" },
    update: {},
    create: { id: "app-11", initiativeId: "init-11", organizationId: "org-democracia-ac", alId: "user-al-dem", status: "COMPLETE" },
  });
  const report11 = await prisma.applicationReviewReport.upsert({
    where: { applicationId: app11.id },
    update: {},
    create: { id: "report-11", applicationId: app11.id, status: "KMD_SIGNED", alSignOffAt: past2, kmdReviewerId: "user-kmd", kmdSignOffAt: past2 },
  });
  const memo11 = await prisma.investmentMemo.upsert({
    where: { reviewReportId: report11.id },
    update: {},
    create: {
      id: "memo-11",
      reviewReportId: report11.id,
      authorAlId: "user-al-dem",
      reviewStatus: "IN_CEO_REVIEW",
      body: "Elecciones Libres CO works to strengthen electoral integrity through parallel vote tabulation and civic education. The organization has a 10-year track record and operates in 6 departments.",
    },
  });
  await upsertPeerReview("pr-11-1", memo11.id, "user-reviewer-1", "COMPLETE", "Strong strategic alignment. The team has deep expertise in electoral observation and has built trusted relationships with civil society. I recommend approval with standard reporting requirements.");
  await upsertPeerReview("pr-11-2", memo11.id, "user-reviewer-2", "COMPLETE", "Solid financial management demonstrated in past audits. Geographic expansion plan is credible. Some concerns about dependency on key staff — recommend requesting a succession plan.");

  // ---- init-8: LEGAL_DUE_DILIGENCE (Alfabetización Digital AR) ----
  const app8 = await prisma.application.upsert({
    where: { initiativeId: "init-8" },
    update: {},
    create: { id: "app-8", initiativeId: "init-8", organizationId: "org-fundacion-leer", alId: "user-al-edu", status: "COMPLETE" },
  });
  const report8 = await prisma.applicationReviewReport.upsert({
    where: { applicationId: app8.id },
    update: {},
    create: { id: "report-8", applicationId: app8.id, status: "KMD_SIGNED", alSignOffAt: past2, kmdReviewerId: "user-kmd", kmdSignOffAt: past2 },
  });
  const memo8 = await prisma.investmentMemo.upsert({
    where: { reviewReportId: report8.id },
    update: {},
    create: {
      id: "memo-8",
      reviewReportId: report8.id,
      authorAlId: "user-al-edu",
      reviewStatus: "IN_CEO_REVIEW",
      body: "Alfabetización Digital AR combines literacy and digital skills training for adults in vulnerable communities. Strong evidence base from a 3-year pilot with 12,000 beneficiaries.",
    },
  });
  await upsertPeerReview("pr-8-1", memo8.id, "user-reviewer-1", "COMPLETE", "Compelling impact evidence. The combination of literacy and digital access is differentiated and needed. I support moving forward.");
  await upsertPeerReview("pr-8-2", memo8.id, "user-reviewer-2", "COMPLETE", "Well-documented approach. Governance structure is sound. Recommend approval.");
  const legalCase8 = await prisma.legalDueDiligenceCase.upsert({
    where: { initiativeId: "init-8" },
    update: {},
    create: { id: "case-8", initiativeId: "init-8", organizationId: "org-fundacion-leer", adId: "user-ad", status: "DOCUMENTS_PENDING" },
  });
  for (const item of [
    { id: "cli-8-1", requiredDocName: "Certificate of incorporation", isRequired: true, status: "ACCEPTED" as const },
    { id: "cli-8-2", requiredDocName: "Latest annual financial report", isRequired: true, status: "PENDING" as const },
    { id: "cli-8-3", requiredDocName: "Board member declarations", isRequired: true, status: "SUBMITTED" as const },
  ]) {
    await prisma.legalChecklistItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, caseId: legalCase8.id },
    });
  }

  // ---- init-9: ONBOARDING (Democracia Participativa BR) ----
  const app9 = await prisma.application.upsert({
    where: { initiativeId: "init-9" },
    update: {},
    create: { id: "app-9", initiativeId: "init-9", organizationId: "org-civic-br", alId: "user-al-dem", status: "COMPLETE" },
  });
  const report9 = await prisma.applicationReviewReport.upsert({
    where: { applicationId: app9.id },
    update: {},
    create: { id: "report-9", applicationId: app9.id, status: "KMD_SIGNED", alSignOffAt: past2, kmdReviewerId: "user-kmd", kmdSignOffAt: past2 },
  });
  const memo9 = await prisma.investmentMemo.upsert({
    where: { reviewReportId: report9.id },
    update: {},
    create: {
      id: "memo-9",
      reviewReportId: report9.id,
      authorAlId: "user-al-dem",
      reviewStatus: "IN_CEO_REVIEW",
      body: "Democracia Participativa BR supports participatory budgeting processes in Brazilian municipalities. Their model has been adopted by 14 cities and the team has strong institutional ties.",
    },
  });
  await upsertPeerReview("pr-9-1", memo9.id, "user-reviewer-1", "COMPLETE", "High-quality, context-sensitive model with demonstrated policy uptake. Strong recommendation.");
  await upsertPeerReview("pr-9-2", memo9.id, "user-reviewer-2", "COMPLETE", "Excellent track record. Financial controls are robust. I strongly support this grant.");
  await prisma.legalDueDiligenceCase.upsert({
    where: { initiativeId: "init-9" },
    update: {},
    create: { id: "case-9", initiativeId: "init-9", organizationId: "org-civic-br", adId: "user-ad", status: "COMPLETE", completedDate: past1 },
  });
  const grant9 = await prisma.grant.upsert({
    where: { initiativeId: "init-9" },
    update: {},
    create: {
      id: "grant-9",
      initiativeId: "init-9",
      organizationId: "org-civic-br",
      areaLeadId: "user-al-dem",
      status: "ACTIVE",
      onboardingStatus: "IN_PROGRESS",
      amount: 150000,
      currency: "USD",
      supportType: ["MEL", "STRATEGIC"],
      reportingCadence: "Quarterly",
      scope: "Expand participatory budgeting to 5 additional municipalities in Minas Gerais.",
    },
  });
  for (const kpi of [
    { id: "kpi-9-1", name: "Municipalities using PB", target: "5 new", cadence: "Annual" },
    { id: "kpi-9-2", name: "Citizens engaged in PB process", target: "25,000", cadence: "Annual" },
  ]) {
    await prisma.kPI.upsert({
      where: { id: kpi.id },
      update: {},
      create: { ...kpi, grantId: grant9.id },
    });
  }

  // ---- init-10: ACTIVE (Competencias Siglo XXI PE) ----
  const app10 = await prisma.application.upsert({
    where: { initiativeId: "init-10" },
    update: {},
    create: { id: "app-10", initiativeId: "init-10", organizationId: "org-voces", alId: "user-al-edu", status: "COMPLETE" },
  });
  const report10 = await prisma.applicationReviewReport.upsert({
    where: { applicationId: app10.id },
    update: {},
    create: { id: "report-10", applicationId: app10.id, status: "KMD_SIGNED", alSignOffAt: past2, kmdReviewerId: "user-kmd", kmdSignOffAt: past2 },
  });
  const memo10 = await prisma.investmentMemo.upsert({
    where: { reviewReportId: report10.id },
    update: {},
    create: {
      id: "memo-10",
      reviewReportId: report10.id,
      authorAlId: "user-al-edu",
      reviewStatus: "IN_CEO_REVIEW",
      body: "Competencias Siglo XXI PE integrates 21st-century skills into the Peruvian public school curriculum. Partnership with MoE provides sustainability and systemic reach.",
    },
  });
  await upsertPeerReview("pr-10-1", memo10.id, "user-reviewer-1", "COMPLETE", "Transformative potential with government partnership ensuring sustainability. Clear recommendation to approve.");
  await upsertPeerReview("pr-10-2", memo10.id, "user-reviewer-2", "COMPLETE", "Strong systems change approach. Financial controls are solid. Recommend approval.");
  await prisma.legalDueDiligenceCase.upsert({
    where: { initiativeId: "init-10" },
    update: {},
    create: { id: "case-10", initiativeId: "init-10", organizationId: "org-voces", adId: "user-ad", status: "COMPLETE", completedDate: past2 },
  });
  const grant10 = await prisma.grant.upsert({
    where: { initiativeId: "init-10" },
    update: {},
    create: {
      id: "grant-10",
      initiativeId: "init-10",
      organizationId: "org-voces",
      areaLeadId: "user-al-edu",
      status: "ACTIVE",
      onboardingStatus: "COMPLETED",
      amount: 200000,
      currency: "USD",
      supportType: ["MEL", "TECH", "STRATEGIC"],
      reportingCadence: "Semi-annual",
      scope: "Integrate 21st-century skills into 500 public schools across Peru over 3 years.",
    },
  });
  for (const kpi of [
    { id: "kpi-10-1", name: "Schools with curriculum integration", target: "500", cadence: "Annual" },
    { id: "kpi-10-2", name: "Teachers trained", target: "2,000", cadence: "Annual" },
    { id: "kpi-10-3", name: "Students reached", target: "120,000", cadence: "Annual" },
  ]) {
    await prisma.kPI.upsert({
      where: { id: kpi.id },
      update: {},
      create: { ...kpi, grantId: grant10.id },
    });
  }

  // ----------------------------------------------------------------
  // Print credentials
  // ----------------------------------------------------------------
  console.log("✅ Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SEEDED CREDENTIALS  (all use password: Vermas2025!)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const u of users) {
    console.log(`  ${u.role.padEnd(14)} ${u.email}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
