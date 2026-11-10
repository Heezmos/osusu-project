# Osusu — Product and Technical Architecture

## Ownership and workspace

Osusu is a product owned and operated under Delight Ventures Limited (DVL). It is not a separate legal entity. This repository is the product codebase; DVL remains the parent venture and governance context.

## Five core services

1. **Digital Wallet** — separate SLE and USD wallets, deposits, withdrawals, transfers, conversion quotes, receipts and transaction history.
2. **Payments & Bank Services** — local and eligible international payment routes, bank linking through authorised providers, linked-account transfers where supported, transparent fees and FX.
3. **Osusu Savings** — personal goals, group Osusu circles, fixed-term plans, scheduled contributions and clearly disclosed plan terms.
4. **Dash Card** — virtual and physical cards, card controls, limits, freeze/unfreeze and card activity through an approved issuer.
5. **Financial Management** — spending insights, savings progress, statements, reports and returns tracking.

Supporting capabilities include KYC/identity checks, account security, alerts, notifications, reminders, support, referrals, payment reconciliation and interest/returns calculators.

## Application structure

- Next.js App Router and TypeScript frontend.
- Supabase Auth and PostgreSQL backend, subject to DVL project confirmation.
- Vercel hosting.
- External payment, bank-linking, FX and card capabilities are provider adapters; do not hardwire assumptions about provider eligibility.

## Database isolation

DVL's shared Supabase workspace already contains other product tables. Osusu database objects must be isolated under a dedicated osusu schema (or a separately approved Osusu project), not mixed into unrelated product tables. Before creating the schema, confirm the intended DVL Supabase project. Do not modify existing Ecofarms, EZGo, Delight Hub or other product tables.

The Data API must expose only intentionally selected objects. Apply least-privilege grants and RLS policies to every exposed table. Internal ledger and provider-webhook tables should not be directly accessible from browser clients.

## Financial core — future implementation requirement

- Immutable double-entry journal; no user-editable wallet balance column.
- Balanced journal lines per currency and transaction.
- Atomic posting and idempotency keys for payment events.
- Provider settlement verification before wallet credit.
- Explicit transaction lifecycle: initiated, pending, processing, settled, failed, reversed/refunded.
- FX quote records must preserve rate, source, timestamp, fees and final receiving amount.
- Reconciliation between provider settlement records and ledger entries.
- Savings commitments and fixed-term/group funds must not be treated as freely spendable wallet balance.
- Privileged adjustments require authorisation, reason, audit trail and balanced journal entries.

## Compliance and partner gates

No live-money operation until DVL verifies applicable Sierra Leone and cross-border requirements, licensing/permissions, KYC/AML controls, safeguarding, consumer disclosures, data protection, partner contracts and operational controls. PayPal must only be used through an eligible authorised merchant/partner arrangement. Bank linking must use authorised providers; never collect bank passwords. Card issuance and savings returns depend on approved regulated partners and documented terms.

## Current implementation status

- Repository foundation: created.
- Customer dashboard: first responsive UI prototype created with sample data only.
- Authentication: not connected.
- Supabase schema and policies: not yet created; awaiting confirmation of the correct DVL Supabase project.
- Live payment rails, card issuance and financial ledger: not implemented.
- Production deployment: not yet configured.
