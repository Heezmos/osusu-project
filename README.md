# DVL Connect — Digital Infrastructure by Delight Ventures

DVL Connect is an African-focused digital infrastructure platform that helps independent business systems exchange data, trigger events and coordinate workflows securely and reliably.

It serves DVL-owned ventures and external businesses, institutions, software vendors and developers. The initial market is Sierra Leone, with a roadmap for wider African markets.

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

## Preview status

This branch is being repurposed from an earlier Osusu product codebase. The current dashboard is a local interactive preview using fictional sample data. Buttons and workflows simulate actions in the browser only; no real integrations, external webhooks, production credentials or live customer data are used.

## Technology foundation

- Next.js App Router
- React and TypeScript
- Supabase client libraries retained for future platform services
- Vercel-compatible deployment
- GitHub source control

The existing Osusu database migrations and financial application logic are not part of the DVL Connect product design. They must not be applied to a DVL Connect Supabase project. New DVL Connect database objects and policies require separate review and implementation.

## Local development

```bash
npm install
npm run dev
```

Optional Supabase configuration is not required for the current preview. Never commit secrets or service-role keys.

## Roadmap

1. Validate the preview with internal DVL ventures and selected pilot customers.
2. Define tenant, organisation, access-control and API project foundations.
3. Implement secure API credentials, sandbox environments and integration registry.
4. Add event delivery, retries, workflow execution and observability.
5. Introduce commercial onboarding, subscriptions and usage-based pricing after validation.

## Product principles

API-first, modular, tenant-isolated, secure by default, auditable, observable and designed to avoid unnecessary complexity before customer demand is validated.
