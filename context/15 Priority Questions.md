# **Answers to the 15 Priority Questions for the Grant Management System**

Based on the current process, use cases, and project context, these are the best current answers to the 15 priority questions needed to clarify the Grant Management System.

---

## **1. What is the first version supposed to solve?**

The first version should create a reliable internal system to manage the full grant/investment lifecycle from **sourcing to onboarding**.

The main problems it should solve are:

|**Problem**|**Why it matters**|
|---|---|
|Pipeline visibility|AL and AT need to track initiatives, organizations, contacts, scoping calls, and stage progress.|
|Review and approval tracking|CEO needs to review concept notes, memos, strategic documents, and record decisions.|
|Document control|The process depends on concept notes, decks, applications, reports, memos, legal documents, and minutes.|
|Handoff management|The workflow includes many handoffs: AL → CEO, AL → KMD, AL → Peer Reviewers, AL → AD, AD → ORG.|
|Legal due diligence tracking|AD needs to request, review, revise, validate, and complete legal documentation.|
|Onboarding coordination|AL, AT, and ORG need to agree on KPIs, scope, reporting, and support options.|

The strongest MVP purpose is:

Centralize initiatives, organizations, documents, reviews, decisions, legal due diligence, and onboarding tasks in one source of truth.

---

## **2. Who are the day-one users?**

The day-one internal users should be:

|**Role**|**Include in MVP?**|**Reason**|
|---|---|---|
|AL — Area Lead|Yes|Owns the initiative pipeline from sourcing to onboarding.|
|AT — Area Team|Yes|Supports sourcing, data entry, scoping notes, document organization, and onboarding.|
|CEO|Yes|Reviews, comments, approves, rejects, and selects review participants.|
|KMD|Yes|Supports strategy, application processing, review reports, and learning structure.|
|AD|Yes|Manages legal due diligence.|
|Peer Reviewers|Yes, with lightweight access|They review and comment on memos.|
|TL|Optional for MVP|Needed only when technical assessment or support planning is required.|
|ORG|Partial access or no full portal in MVP|External organizations can initially submit through forms or secure upload links.|

The main actors are:

- CEO
- KMD
- AL
- AT
- AD
- TL
- ORG
- Peer Reviewer

---

## **3. Will external organizations use the system in MVP?**

Recommended MVP answer: **partially, but not necessarily through a full portal**.

External organizations need to submit:

- Concept notes
- Institutional decks
- Full applications
- Legal forms
- Legal documents
- Revision responses
- Onboarding information
- Potentially future reports

However, for the MVP, it is better to avoid building a full external portal immediately unless it is essential.

Recommended MVP approach:

|**Option**|**Recommendation**|
|---|---|
|Secure submission links/forms|Best for MVP|
|Internal staff upload ORG documents|Acceptable for first internal version|
|Full ORG portal with login|Better for Phase 2|
|ORG dashboard with status tracking|Phase 2|
|Ongoing grantee reporting portal|Phase 2 or Phase 3|

MVP assumption:

ORGs submit materials through controlled forms or secure upload links, while internal users manage review, approvals, and tracking.

---

## **4. What are the official lifecycle stages?**

The official lifecycle stages are:

1. **Company Strategy**
2. **Thematic Strategy**
3. **Sourcing**
4. **Screening**
5. **Investment Due Diligence**
6. **Legal Due Diligence**
7. **Onboarding**

For the practical grant/initiative pipeline, the system stages should be:

|**System Stage**|**Description**|
|---|---|
|Sourced|Opportunity identified by AL/AT|
|Scoping|Short scoping call planned or completed|
|Screening Materials Requested|Concept note/deck requested|
|Concept Review|Concept note prepared and sent to CEO|
|Concept Approved / Rejected / Revision Needed|CEO decision|
|Application Requested|Full application requested|
|Application Received|AL informs KMD|
|Application Review|AL and KMD produce review report|
|Memo Drafting|AL writes memo|
|Peer Review|Peer reviewers comment|
|CEO / Investment Committee Review|CEO questions and memo review meeting|
|Memo Approved / Rejected / Revision Needed|Decision point|
|Legal Due Diligence|AD manages documents and validation|
|Legal DD Complete|AD marks legal package complete|
|Onboarding|Kick-off, KPIs, scope, reporting, support|
|Active / Post-Onboarding Reporting|Optional Phase 2 or Phase 3|

---

## **5. What fields are required for an initiative record?**

The required MVP fields should include:

|**Field**|**Required?**|**Rationale**|
|---|---|---|
|Initiative name|Yes|Needed for CRM pipeline|
|Organization or individual name|Yes|Process tracks initiative/person/organization|
|Primary contact name|Yes|Required for sourcing CRM list|
|Contact email|Yes|Required for sourcing CRM list|
|Contact phone|Yes|Required for sourcing CRM list|
|Area / thematic area|Yes|AL and AT implement by area|
|Country / region|Recommended|Important for Latin America portfolio tracking|
|100-word summary|Yes|Explicitly required in sourcing|
|Source of opportunity|Recommended|Public information, networks, sector expertise|
|Current stage|Yes|Needed for pipeline management|
|Assigned AL|Yes|AL owns pipeline|
|Supporting AT members|Recommended|AT supports sourcing and onboarding|
|Strategic fit assessment|Yes|Screening uses Investment Criteria Set 1|
|Solution strength / learning value assessment|Yes|Concept note uses Investment Criteria Set 2|
|Execution capacity / impact-scale assessment|Later|Memo uses Investment Criteria Set 3|
|Key documents|Yes|Concept note, deck, application, memo, legal documents|
|CEO decision status|Yes|Approval/rejection/revision tracking|
|Legal DD status|Yes|AD workflow|
|Onboarding status|Yes|Kick-off, KPIs, reporting, support|

Minimum MVP initiative record:

- Initiative name
- Organization/person name
- Contact name
- Email
- Phone
- Area
- Country
- 100-word summary
- Current stage
- Assigned AL
- Strategic fit notes
- Documents
- Decision status
- Legal DD status
- Onboarding status

---

## **6. What documents are required at each stage?**

|**Stage**|**Required or expected documents**|
|---|---|
|Company Strategy|Investment process map, investment criteria guidelines|
|Thematic Strategy|ToC, investment thesis, learning agenda|
|Sourcing|Opportunity profile, contact information, 100-word summary, scoping call notes|
|Screening|Concept note, institutional pitch/deck|
|Concept Review|AL-prepared “why yes / why not” concept note, concept review meeting minutes|
|Investment Due Diligence|Full application form, application review report|
|Memo Review|Peer-reviewed memo, peer reviewer comments, AL responses, CEO written questions/comments, investment committee minutes|
|Legal Due Diligence|Required legal documents, forms, support materials, submitted documents, revision requests, trust validation record|
|Onboarding|Kick-off minutes, KPIs, timing, scope, reporting conditions, support options|

The MVP should allow each initiative to have a document library organized by stage.

---

## **7. What approval decisions can the CEO make?**

The CEO should be able to record at least these decisions:

|**Decision**|**Use**|
|---|---|
|Approved|Initiative moves to the next stage|
|Rejected|Initiative stops|
|Revision requested|AL/KMD/ORG must revise and resubmit|
|Conditionally approved|Initiative can move forward if conditions are met|
|Deferred / on hold|Useful when a decision is postponed|

CEO approval applies to:

- Strategic documents
- Concept notes
- Investment memos
- Possibly final investment committee decisions

The CEO should also be able to:

- Comment on documents
- Ask written questions
- Request revisions
- Select up to two participants for review meetings
- Record decision rationale
- View decision history

---

## **8. Who can move an initiative from one stage to another?**

Recommended stage-transition ownership:

|**Transition**|**Who should trigger it**|
|---|---|
|New opportunity → Sourcing|AL or AT|
|Sourcing → Scoping|AL|
|Scoping → Screening materials requested|AL|
|Screening materials received → Concept review|AL|
|Concept review → Application requested|CEO approval, action by AL|
|Application received → Application review|AL notifies KMD|
|Application review → Memo drafting|AL/KMD complete report; AL proceeds|
|Memo drafting → Peer review|AL|
|Peer review → CEO / memo review|AL after responding to peer comments|
|Memo approved → Legal due diligence|CEO/investment committee approval; AL notifies AD|
|Legal DD started → Legal DD complete|AD|
|Legal DD complete → Onboarding|AL|
|Onboarding → Active / reporting|AL/AT, possibly ORG|

Recommended rule:

AL is the main lifecycle owner, but CEO, KMD, AD, peer reviewers, and ORG control specific gates, inputs, or validations.

Still needs confirmation:

- Whether AT can move stages independently or only support AL.
- Whether KMD can block progression if the application review report is incomplete.
- Whether AD can block onboarding if legal due diligence is incomplete.

---

## **9. What legal due diligence checklist is required?**

The exact legal due diligence checklist is not yet defined.

What is clear:

- Legal due diligence begins after memo approval.
- AL informs AD that legal due diligence should start.
- AD defines the required legal documents, forms, and support materials.
- AL sends the list to the external organization.
- ORG completes forms and submits documents.
- AD validates the documentation with the trust.
- If revisions are needed, the legal due diligence flow restarts.

For MVP, the system should allow AD to create or select a checklist per organization.

The legal due diligence checklist module should support:

|**Checklist capability**|**MVP need**|
|---|---|
|Required document list|Yes|
|Document upload|Yes|
|Document-level status|Yes|
|Revision request|Yes|
|Trust validation log|Yes|
|Completion approval|Yes|
|Exportable compliance summary|Recommended|

Recommended legal DD statuses:

1. Not started
2. Requested
3. Documents pending
4. Submitted
5. Under AD review
6. Revisions requested
7. Resubmitted
8. Sent to trust / trust validation
9. Validated
10. Rejected
11. Complete

Still needs confirmation:

- Exact legal document types.
- Whether requirements vary by country.
- Whether requirements vary by grant size.
- Whether requirements vary by organization type.
- Whether the trust needs direct access or AD records trust validation manually.

---

## **10. Should forms be built into the system or uploaded as files?**

Recommended answer: **hybrid model for MVP**.

|**Item**|**MVP approach**|
|---|---|
|Opportunity profile|Built into the system|
|Scoping call notes|Built into the system|
|100-word summary|Built into the system|
|Concept note|Upload file first; structured fields later|
|Institutional deck|Upload file|
|Full application|Ideally built as a form, but can start as upload if template already exists|
|Application review report|Upload or internal structured template|
|Investment memo|Upload or collaborative document link|
|Peer reviewer comments|Built into the system|
|CEO decision|Built into the system|
|Legal DD checklist|Built into the system|
|Legal documents|Upload files|
|Kick-off minutes|Built into the system or uploaded|
|KPI/reporting agreement|Built into the system|

Recommended MVP principle:

Build structured fields for data that must be searched, filtered, reported, or used in dashboards. Allow file uploads for long-form narrative documents.

---

## **11. What dashboards are needed for leadership?**

The CEO / leadership dashboard should show:

|**Dashboard section**|**What it should show**|
|---|---|
|Pipeline by stage|Number of initiatives in sourcing, screening, due diligence, legal, onboarding|
|Pending CEO decisions|Concept notes, memos, strategy documents awaiting CEO review|
|Bottlenecks|Initiatives stuck in stage too long|
|Upcoming meetings|Concept review, memo review, investment committee, kick-off|
|Decision history|Approved, rejected, conditionally approved, revisions requested|
|Legal DD status|Not started, in progress, revisions requested, validated|
|Area / thematic view|Pipeline by AL, area, or strategic theme|
|Documents pending review|Concept notes, applications, memos|
|Reporting / learning view|Learning agenda evidence and post-onboarding reporting, likely Phase 2|

MVP dashboard should include:

- Total initiatives by stage
- Initiatives requiring CEO action
- Initiatives requiring AL action
- Legal DD status
- Upcoming review meetings
- Stuck or delayed initiatives
- Recent decisions
- Pipeline by area/theme

---

## **12. What tools must the system integrate with?**

The current context does not specify existing required integrations.

Likely integrations to evaluate:

|**Tool category**|**Why it may be needed**|
|---|---|
|Email|Notifications to AL, CEO, KMD, AD, ORG, and peer reviewers|
|Calendar|Concept review meetings, memo review meetings, kick-off meetings|
|Document storage|Concept notes, decks, applications, memos, legal documents|
|E-signature|Possibly useful for approvals or legal documentation|
|CRM / spreadsheet import|If current pipeline exists in Google Sheets, Airtable, Monday.com, or another tool|
|Identity / SSO|Internal permissions and secure access|
|BI / reporting|Leadership dashboards and compliance summaries|

Possible tools to confirm:

- Google Workspace
- Microsoft 365
- Monday.com
- Airtable
- SmartSuite
- Salesforce
- Slack
- Zapier
- DocuSign
- Google Drive
- SharePoint
- Notion

Still needs confirmation:

Which tools the organization already uses and which ones must be integrated in the MVP.

---

## **13. What data must be migrated from existing tools?**

The current context does not identify existing databases, spreadsheets, or tools to migrate from.

However, the system will likely need import or migration for:

|**Data type**|**Priority**|
|---|---|
|Existing organizations|High|
|Existing contacts|High|
|Existing initiatives/opportunities|High|
|Current pipeline stage|High|
|Existing concept notes/decks/applications|Medium-high|
|Existing legal DD documents|Medium-high|
|Historical CEO decisions|Medium|
|Previous investment memos|Medium|
|Previous reporting/KPI data|Medium|
|Strategy documents and investment criteria|High|
|Learning agenda documents|Medium-high|

Recommended MVP migration approach:

1. Start with active opportunities only.
2. Import organizations, contacts, initiatives, stages, AL ownership, and key documents.
3. Add historical records later if needed.
4. Avoid migrating every old document unless it is legally or operationally necessary.

Still needs confirmation:

- Where current data lives.
- How clean the data is.
- Whether historical records are required for reporting or compliance.
- Whether existing documents are organized consistently.

---

## **14. What permissions are needed by role?**

Recommended MVP permissions:

|**Role**|**Permissions**|
|---|---|
|CEO|View all initiatives, strategy documents, concept notes, memos, dashboards; comment; approve/reject/request revisions; select meeting participants|
|KMD|Create/edit strategy documents; process application information; co-author application review reports; manage knowledge repository and learning agenda|
|AL|Create/manage initiatives; move pipeline stages; request materials; draft concept notes and memos; nominate peer reviewers; notify KMD/AD; manage onboarding|
|AT|Create/edit opportunity records, contacts, summaries, scoping notes, tasks, document organization, onboarding support items|
|AD|Manage legal DD cases; define checklists; review submissions; request revisions; record trust validation; mark legal DD complete|
|TL|View assigned initiatives/documents; provide technical assessment; recommend support; participate in onboarding support plan|
|Peer Reviewer|View assigned memo; comment; ask questions; provide sign-off|
|ORG|Submit concept note/deck/application/legal documents; respond to revisions; view own submission status; participate in onboarding/reporting|
|Admin|Manage users, roles, templates, permissions, system settings|

Important MVP security rule:

ORGs should only see their own records and should not see internal comments, CEO notes, peer reviewer comments, internal assessments, or investment memos unless intentionally shared.

Additional permission considerations:

- Some CEO/KMD/AL comments may be internal only.
- Legal documents should have restricted access.
- Peer reviewers should only access assigned memos.
- AT may not need access to all legal documents.
- TL should only access initiatives requiring technical review or support.
- Admin access should be limited to system managers.

---

## **15. What is the MVP budget and timeline?**

This cannot be answered definitively from the current information because no budget, timeline, team size, technology preference, or procurement constraint has been provided.

However, based on the process complexity, there are three likely MVP paths:

|**MVP path**|**Likely scope**|**Typical timeline**|**Relative cost**|
|---|---|---|---|
|Low-code MVP|Internal pipeline, documents, statuses, checklists, dashboards|6–10 weeks|Lower|
|Custom lightweight MVP|Custom database, internal app, role permissions, document upload, basic dashboards|10–16 weeks|Medium|
|Robust platform MVP|Internal app + external portal + advanced permissions + audit + reporting|16–24+ weeks|Higher|

Recommended approach:

Start with a 2–4 week discovery and design phase before committing to a full build budget.

The discovery phase should produce:

- MVP scope
- Detailed workflows
- Data model
- Role permissions
- Screen map
- Document requirements
- Integration requirements
- Technology recommendation
- Implementation roadmap
- Budget estimate
- Timeline estimate

---

# **Current Best MVP Definition**

Based on everything provided, the MVP should be:

An internal grant/investment management system that allows AL, AT, CEO, KMD, AD, and peer reviewers to manage initiatives from sourcing through screening, application, memo review, legal due diligence, and onboarding, with centralized records, document uploads, role-based permissions, approval decisions, legal DD checklists, notifications, dashboards, and audit history.

The MVP should prioritize internal workflow control first.

A full external ORG portal should not be mandatory for the first version. Instead, the MVP can start with secure submission/upload links or internal upload by staff, then build the ORG portal in Phase 2.

---

# **Recommended MVP Scope**

## **Must-have**

- CRM-style initiative pipeline
- Organization and contact records
- Initiative records
- Stage/status tracking
- AL/AT ownership
- 100-word opportunity summary
- Scoping call notes
- Document upload by stage
- Concept note tracking
- Application tracking
- CEO review and decision log
- Peer reviewer comments
- Legal due diligence checklist
- Legal document upload
- Revision request tracking
- Trust validation status
- Onboarding checklist
- Basic dashboards
- Basic notifications
- Role-based permissions
- Audit trail

## **Should-have**

- Meeting minutes
- Calendar integration
- Email notification templates
- Application review report template
- Investment memo template
- KMD knowledge workspace
- KPI and reporting agreement fields
- Compliance summary export

## **Nice-to-have**

- Full external organization portal
- ORG login and status dashboard
- Advanced analytics
- AI-assisted summaries
- AI-assisted memo review
- Automated reminders
- E-signature integration
- Advanced learning agenda tracking
- Custom workflow builder

---

# **Remaining Open Questions**

The following items still need confirmation before building:

1. What tools are currently used to manage the pipeline and documents?
2. Where are existing organizations, contacts, and initiatives stored?
3. What legal documents are required for due diligence?
4. Do legal requirements vary by country, grant size, or organization type?
5. Should ORGs have login accounts in the MVP?
6. Should the system support multiple languages?
7. What budget range is available for MVP?
8. What launch timeline is desired?
9. Who will maintain the system after launch?
10. Should the system be built in low-code, customized CRM, or custom software?