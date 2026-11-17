# DVL Connect — Digital Infrastructure by Delight Ventures

DVL Connect is an African-focused digital infrastructure platform that helps independent business systems exchange data, trigger events and coordinate workflows securely and reliably.

It serves DVL-owned ventures and external businesses, institutions, software vendors and developers. The initial market is Sierra Leone, followed by wider African markets.

## Product scope

- API development and connectivity
- Enterprise systems integration (ERP, CRM, HR, payroll, accounting, inventory, logistics, e-commerce and education)
- Workflow orchestration and automation
- Data exchange and synchronisation
- Events, webhooks and notifications
- Developer portal, documentation, sandbox and integration tooling
- Monitoring, logs, error handling and operational visibility

## Initial exclusions

The initial product does **not** process payments, connect to banks or mobile-money rails, operate consumer wallets, hold funds, issue cards, make payouts or perform financial settlements. Any future financial connectivity requires authorised partners, regulatory review and separate approval. DVL Connect is not presented as a regulated payment provider.

## Current implementation

The dashboard now uses Supabase Auth and the DVL Connect database schema for account sessions, workspace creation/loading and API project creation. It no longer presents fabricated request metrics or fake connected systems as live operational data.

The following modules remain planned and are not yet operational: connector execution, API gateway/request telemetry, workflow engine, event processing, webhook delivery, developer-issued API credentials and team invitations/role administration.

## Supabase environment

DVL Connect uses the existing **DVL Projects** Supabase project:

- Project ref: `dadjxxjqqprzlroltpra`
- URL: `https://dadjxxjqqprzlroltpra.supabase.co`
- Core schema: `dvl_connect`
- Private schema: `dvl_connect_private`

In Supabase Dashboard → Project Settings → API → Exposed schemas, add **only** `dvl_connect`. Do not expose `dvl_connect_private`. The private schema contains credential storage and must remain inaccessible to browser clients.

Copy `.env.example` to `.env.local` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use a publishable key in browser/server-rendered application code. Never commit secrets or expose a service-role key through a `NEXT_PUBLIC_*` variable. Any service-role operation must run only in a protected server-side worker or route with explicit authorization.

## Database foundation

The `dvl_connect` schema contains organisation, organisation-membership, API-project and audit-log foundations with row-level security. The `dvl_connect_private` schema contains protected API credential storage with no client grants and a deny-all RLS policy. API secrets are not yet issued or accepted by a gateway.

The old Osusu schema and Osusu-specific public RPC functions have been retired from this Supabase project. Existing unrelated DVL venture tables remain in place. Historical Osusu migration files and design documents remain in the Git repository as archived development history; do not apply them to this project.

## Local development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Delivery milestones

1. Complete API schema exposure, authentication and workspace access verification.
2. Implement organisation membership administration and invitation workflows.
3. Implement secure API credential issuance, rotation and revocation.
4. Build API gateway, request logging and per-tenant rate controls.
5. Add connector framework, mappings, events, webhooks and durable workers.
6. Add workflow orchestration, retries, dead-letter handling and monitoring.
7. Introduce commercial onboarding, subscriptions and usage-based pricing after pilot validation.

## Product principles

API-first, modular, tenant-isolated, secure by default, auditable, observable and designed to avoid unnecessary complexity before customer demand is validated.
