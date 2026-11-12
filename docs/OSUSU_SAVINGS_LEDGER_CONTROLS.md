# Savings ledger controls — implementation status

## Added in this release
- Each savings plan now has a dedicated savings-liability ledger account. Existing plans were backfilled with empty ledger accounts; no balances or customer funds were created or moved.
- Added private `osusu.savings_transactions` with user, plan, movement type, amount, currency, confirmation status, posted journal reference, idempotency key and timestamp.
- Added authenticated RPC `public.osusu_move_savings_funds` for wallet-to-savings contributions and savings-to-wallet withdrawals.
- Every accepted movement is posted through the existing balanced, immutable journal engine and mirrored to wallet transaction history and audit events.
- The movement RPC serializes identical request keys with a transaction-scoped advisory lock, checks ownership, plan status, currency, funding approval, KYC/account state, active wallet and available ledger balance.
- Added savings current balance, contribution and withdrawal totals, and recent transaction activity to the customer's savings response.
- Added customer UI for balances, recent activity, contribution and withdrawal controls.

## Safety gates
- No savings product has `funding_enabled=true`. No customer movement is enabled by this migration.
- The movement RPC rejects requests unless the product is explicitly funding-enabled, the customer account is active, KYC is verified, and the linked wallet is active.
- The current test account and wallets remain pending; no account status or KYC state was changed.
- No interest rate, fixed-term return, maturity promise, automatic debit or external payment rail was activated.

## Verification
- Migration applied successfully to the DVL Projects Supabase database.
- Verified the new transactions table has RLS enabled.
- Verified anonymous users cannot execute the movement RPC; authenticated users can call it, with ownership and business rules checked inside the function.
- Verified zero savings products are funding-enabled and zero savings plans are missing a ledger account.
- Supabase security advisor continues to report existing private-schema RLS-without-policy informational findings and pre-existing public-schema SECURITY DEFINER warnings. These findings were not bulk-modified because they span unrelated DVL services; review separately before launch.
- A rollback-only authenticated movement rejection test is still pending; no live contribution or withdrawal was attempted.

## Next required work
1. Complete a controlled rollback-only end-to-end journal test with a dedicated synthetic test user and active test wallet.
2. Build schedule due-date management and reminder delivery without automatically collecting funds.
3. Complete approved product terms, provider onboarding, safeguarding and compliance review before enabling any product funding.
4. Add interest accrual and maturity logic only after the applicable approved product terms and rate calculation basis are confirmed.
