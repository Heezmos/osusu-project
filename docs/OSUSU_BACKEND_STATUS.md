# Osusu backend foundation

**Product owner:** Delight Ventures Limited (DVL)  
**Supabase project:** DVL Projects  
**Private schema:** `osusu`  
**Applied Supabase migration:** `20261110144153_osusu_private_financial_foundation`

## Current database foundation

The private `osusu` schema contains 16 tables:

- `customer_profiles` — customer profile and account/KYC state references.
- `wallets` — SLE and USD wallet containers.
- `ledger_accounts`, `journal_entries`, `journal_lines` — accounting foundation for immutable double-entry posting.
- `payment_intents`, `provider_events` — payment workflow and provider callback records.
- `fx_quotes` — time-limited currency conversion quotes and fee data.
- `savings_accounts`, `savings_circles`, `savings_circle_members`, `savings_contributions` — personal and group savings foundation.
- `card_accounts` — issuer references and card metadata only; never store PAN or CVV.
- `notifications` — customer notifications.
- `audit_events` — operational audit trail.
- `wallet_transactions` — customer-facing transaction history linked to wallet and ledger workflows.

## Access boundary

- The schema is not intended to be exposed through the Supabase Data API.
- `anon` and `authenticated` have no schema usage or table grants.
- RLS is enabled on all 16 tables. No end-user policies are defined yet, so direct client access is denied by default.
- `service_role` has schema/table privileges for trusted server-side operations only. Never put its key in browser code or a `NEXT_PUBLIC_*` variable.

## Important implementation rules

1. Never update wallet balances directly. Derive balances from posted ledger lines.
2. Use `osusu.post_journal_entry(...)` for trusted server-side posting. It validates balanced debits and credits per currency, validates account/currency matching, enforces idempotency, and commits the journal atomically.
3. Only verified provider events may advance payment intents or create ledger postings. Verify provider signatures and reconcile settlement independently.
4. Keep provider payloads, journal data, audit records, and sensitive KYC references server-side.
5. Add ownership-aware read policies only when a dedicated, safe API boundary is designed. Do not grant direct client writes to ledger tables.
6. Card issuance, bank linking, international payments, and returns-bearing savings products remain disabled until authorised providers, legal permissions, and compliance controls are confirmed.

## Ledger posting engine

The database now includes `osusu.post_journal_entry(...)`, executable only by `service_role`. It accepts a transaction reference, idempotency key, transaction type, optional description/provider reference, and JSON journal lines. It validates each account and currency, requires at least two positive lines, checks debit/credit equality separately for each currency, and writes the entry and lines in one database transaction. Repeating a successfully posted idempotency key returns the original journal entry ID. Posted entries and their lines are protected from update/delete; corrections must use a separate reversal entry.

The function is `SECURITY DEFINER` in the private schema with an empty search path, fully qualified object references, and execute privileges revoked from `PUBLIC`, `anon`, and `authenticated`. Only `service_role` can execute it. Never expose the service-role key to the browser.

## Verification snapshot

- PostgreSQL: 17.11
- Osusu tables: 15
- Tables with RLS enabled: 15
- Direct table grants to `anon` / `authenticated`: 0
- Ledger function: 1, restricted to `service_role`
- Rollback-only tests: balanced posting passed; repeated idempotency returned the same entry; unbalanced posting rejected; posted-entry mutation rejected; test rows rolled back (0 leftovers)
- Public schema table count before and after Osusu foundation: 62

Supabase security advisor also reports informational `RLS Enabled No Policy` findings for these private tables. This is intentional at this stage: no browser role can access the schema, and trusted server operations are the only planned access path. The advisor separately reported existing public-schema function and Auth configuration warnings; those belong to the shared DVL project and were not changed as part of Osusu work.


## Wallet and payment workflow layer

The schema now also includes `wallet_transactions` and trusted server-only functions:

- `osusu.create_customer_wallet(user_id, currency)` creates or returns the customer's SLE/USD wallet and its customer ledger account. Wallets start as `pending`; activation is an authorised operational action.
- `osusu.create_payment_intent(...)` creates idempotent deposit, withdrawal, transfer and supported payment intents only against an active wallet owned by that customer.
- `osusu.record_internal_transfer(...)` performs same-currency wallet-to-wallet transfers, locks both wallets in deterministic order, checks the source ledger balance, posts the balanced journal, and records debit/credit transaction history.
- `osusu.transition_payment_intent(...)` enforces allowed payment lifecycle transitions. It does not verify provider signatures; only a trusted backend after independent provider verification may call it.

All new wallet/payment functions are restricted to `service_role`; `anon` and `authenticated` cannot execute them. The new transaction history table has RLS enabled and no client-role grants or policies.

### Workflow test results

Rollback-only database tests confirmed that an internal SLE transfer moved 125 from a 500 source balance to the destination (375 / 125), and that an overdraw attempt was rejected. Test users, wallets, ledger entries and transaction history were rolled back; no test data remains.

The test suite also confirmed 16 Osusu tables with RLS enabled, zero direct table grants to browser roles, and the original 62 public tables unchanged.

### Authenticated customer account RPCs

The live Supabase database also contains two customer-safe RPCs in the exposed public schema. Their source SQL is recorded in supabase/operations/osusu_customer_read_rpcs.sql.

- public.osusu_initialize_my_account() derives the customer identity exclusively from auth.uid(), creates the customer's profile and SLE/USD wallets idempotently, and creates the corresponding ledger accounts.
- public.osusu_get_my_overview() derives identity from auth.uid() and returns only that customer's profile, ledger-derived wallet balances, savings goals, and latest 20 wallet transactions.
- Both functions are SECURITY DEFINER, use an empty search_path, qualify database objects, and reject calls without an authenticated user.
- Execute is revoked from PUBLIC and anon; it is granted to authenticated and service_role. Direct table access to the private osusu schema remains unavailable to browser roles.
- The Next.js client calls account initialization before requesting the overview. The app clears overview state on every auth-session change and discards responses from stale session revisions.

These SQL definitions were applied directly to the live Supabase project before being recorded in the repository. The SQL file is an auditable source copy, not a Supabase CLI migration. Do not reapply it as a migration without first reconciling the remote migration history.

### Remaining before real-money operations

- Implement provider-specific webhook signature verification, event replay protection and settlement reconciliation.
- Add trusted server API routes for privileged financial actions with strict authentication/authorization, request validation, rate limiting and audit logging.
- Add reversal workflows, operational approval controls and integration tests.
- Complete KYC/AML integrations, payment providers, bank connections, card issuing, settlement/reconciliation jobs, safeguarding and legal/regulatory approvals.
- Keep deposits, withdrawals, external transfers, card issuance and returns-bearing savings products disabled until those controls and authorisations are in place.

## Not production-ready for live money

The authenticated dashboard and customer read RPCs are connected to the database foundation, but Osusu is not a live-money system. Ledger-backed balances and account status can be read; real deposits, withdrawals, provider payments, bank linking, card issuing, and savings returns are not enabled.
