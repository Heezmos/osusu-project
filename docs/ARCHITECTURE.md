# DVL Connect — Product & Technical Architecture

## Product definition

DVL Connect is digital infrastructure that enables secure, reliable and automated transactions and information exchange between independent digital systems. A transaction can be a record, data exchange, instruction, business event, service request or confirmation; it does not imply a payment.

The platform serves DVL's internal ventures and external businesses, institutions, software vendors and developers. Initial market: Sierra Leone, followed by West Africa and wider African markets.

## Initial capabilities

1. API development and connectivity.
2. Enterprise integration across ERP, CRM, HR, payroll, accounting, inventory, logistics, e-commerce and education.
3. Workflow orchestration and automation.
4. Data exchange and synchronisation.
5. Events, webhooks and notifications.
6. Developer portal, documentation, credentials, sandbox and reusable connectors.
7. Monitoring, logs, error handling, replay safeguards and analytics.
8. General record reconciliation where useful; no financial settlement or payment reconciliation in the initial MVP.

## Explicit exclusions for initial MVP

No payment processing, bank/mobile-money/payment-gateway connections, consumer wallet, custody, holding funds, payouts or settlements. Do not represent DVL Connect as a regulated payment provider. Future financial-provider connectivity is a separate decision requiring authorised partners and regulatory review.

## Architecture principles

- API-first, modular architecture with clear service boundaries.
- Multi-tenant isolation; users may belong to multiple organisations.
- Strong authentication and server-side authorisation.
- Encryption in transit and at rest; secrets stored in a dedicated vault or secure secret store.
- API credentials generated with high entropy, shown once, hashed or securely referenced, and revocable.
- Idempotency for operations and event processing.
- Durable asynchronous processing, retries and dead-letter handling.
- Signed webhooks, delivery logs, replay safeguards and SSRF prevention.
- Audit trails, sandbox/production separation, API versioning and rate limits.
- Privacy, data minimisation, retention controls and data-processing agreements.
- Observability, incident response and service-level objectives.
- Do not build modules before validated customer demand.

## Proposed application layers

1. Presentation: Next.js + TypeScript dashboard and developer portal.
2. API gateway/security: authentication, authorisation, tenant context, rate limits and request validation.
3. Core modules: identity, organisations, access control, API management, integrations, workflows, events/webhooks, audit and usage.
4. Integration/processing: connector adapters, mapping, transformation, durable jobs, retry and dead-letter processing.
5. Data/storage: PostgreSQL, secure secret references, object storage where required and optional cache.
6. External connectivity: customer systems and authorised third-party APIs.

A persistent worker and durable queue are recommended for long-running workflows and retries. Do not rely exclusively on short-lived serverless functions for those tasks. Vercel can host the frontend; worker hosting should be selected separately when required.

## Proposed data domains

- users, organisations, organisation_members, roles, permissions, invitations
- api_projects, api_credentials, api_request_logs
- integrations, connections, integration_endpoints, data_mappings
- workflows, workflow_steps, workflow_executions, workflow_execution_steps
- events, event_subscriptions, webhooks, webhook_deliveries
- audit_logs, notifications, usage_records, subscription_plans, organisation_subscriptions

The initial implemented subset is organisations, organisation_members, api_projects and audit_logs in dvl_connect, plus api_credentials in the unexposed dvl_connect_private schema. Other listed domains remain proposals. Use organisation ownership, UUID identifiers, UTC timestamps, tenant-aware indexes and strict row-level security. Enforce same-tenant relationships in server-side logic as well as database constraints. Never expose service-role credentials to browsers.

## Proposed API conventions

Proposed base URL: `https://api.dvlconnect.com/v1` (not registered or deployed). REST/JSON, versioned routes, standard error envelopes, request IDs, scoped idempotency keys and asynchronous workflow acceptance responses. Publish an OpenAPI specification before external developer onboarding.

## Security and operational controls

- Separate sandbox and production credentials and resources.
- Never store raw API secrets or show a secret again after creation.
- Sign outgoing webhooks (HMAC-SHA256), verify timestamps, protect against replay and block private/internal network targets to prevent SSRF.
- Apply per-tenant rate limits and usage controls.
- Maintain immutable or append-only audit evidence for sensitive actions.
- Define data retention, backups, recovery objectives and incident response before production.

## Implementation status — 17 November 2026

The DVL Connect branch now has a Supabase Auth sign-in/sign-up experience and a dashboard connected to the existing DVL Projects database. The dashboard creates or loads the signed-in user's organisation and supports creating/listing API project records.

Database foundations are applied and tracked in supabase/migrations:
- dvl_connect.organisations, organisation_members, api_projects and audit_logs.
- dvl_connect_private.api_credentials is protected by RLS, a deny-all client policy and no client table grants.
- Tenant-aware policies restrict organisations and projects to active members and their permitted roles.
- Creator membership is inserted by a database trigger. Direct client writes to membership are disabled pending a dedicated invitation and role-administration workflow.
- The old Osusu schema, its Osusu RPCs and the Osusu savings-reminder cron route have been retired. Other DVL venture tables remain in the shared project.

The dvl_connect schema still needs to be added to Supabase Project Settings → API → Exposed schemas before browser Data API requests can work. Do not expose dvl_connect_private.

The current application does not yet issue API credentials, run a gateway, deliver webhooks, execute workflows, or provide live request metrics. Integration, event, workflow and operational screens must remain clearly marked as planned until their backend is implemented.

## Delivery milestones

1. Complete API schema exposure and verify sign-up, sign-in, organisation creation and API project CRUD.
2. Implement organisation membership administration and invitation workflows.
3. Implement secure API credential issuance, rotation and revocation.
4. Build API gateway, request logging and per-tenant rate controls.
5. Add connector framework, mappings, events, webhooks and durable workers.
6. Add workflow orchestration, retries, dead-letter handling and monitoring.
7. Introduce commercial onboarding, subscriptions and usage-based pricing after pilot validation.
