# Osusu backend foundation

**Product owner:** Delight Ventures Limited (DVL)  
**Supabase project:** DVL Projects  
**Private schema:** `osusu`  
**Applied Supabase migration:** `20261110144153_osusu_private_financial_foundation`

## Current database foundation

The private `osusu` schema contains 15 tables:

- `customer_profiles` — customer profile and account/KYC state references.
- `wallets` — SLE and USD wallet containers.
- `ledger_accounts`, `journal_entries`, `journal_lines` — accounting foundation for immutable double-entry posting.
- `payment_intents`, `provider_events` — payment workflow and provider callback records.
- `fx_quotes` — time-limited currency conversion quotes and fee data.
- `savings_accounts`, `savings_circles`, `savings_circle_members`, `savings_contributions` — personal and group savings foundation.
- `card_accounts` — issuer references and card metadata only; never store PAN or CVV.
- `notifications` — customer notifications.
- `audit_events` — operational audit trail.

## Access boundary

- The schema is not intended to be exposed through the Supabase Data API.
- `anon` and `authenticated` have no schema usage or table grants.
- RLS is enabled on all 15 tables. No end-user policies are defined yet, so direct client access is denied by default.
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

## Not production-ready yet

This is a database foundation, not a live-money system. It does not yet include balanced-ledger posting functions/triggers, complete user-facing RLS policies, KYC integrations, payment providers, bank connections, card issuing, settlement/reconciliation jobs, or legal/regulatory approval.
