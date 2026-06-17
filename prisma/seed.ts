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
