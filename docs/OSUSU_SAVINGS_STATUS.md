# Osusu savings feature status

## Customer-facing savings catalogue
- Flexi Save: available for goal setup, with flexible contributions and no advertised return.
- Goal Builder: available for personal target setup, with no advertised return.
- Scheduled Saver: available for plan setup with a chosen contribution frequency and scheduled amount. Automatic collection is not enabled.
- Fixed-Term Growth: visible in the catalogue but unavailable until legal/partner approval confirms term, rate, fees, liquidity, maturity and disclosure terms.
- Osusu Circle: visible as a planned group product; group creation, membership and contribution collection are not enabled in this release.

## Implemented
- Private `osusu.savings_products` catalogue with explicit listing, availability and rate-approval states.
- Authenticated RPC to read the catalogue.
- Authenticated RPC to create a personal goal or scheduled savings plan. Ownership comes from `auth.uid()`; user IDs are not accepted from the browser.
- Authenticated RPC to list the current user's savings plans and confirmed contribution totals.
- Audit event written when a plan is created.
- Customer UI for catalogue browsing, plan setup, target amount, currency and frequency.
- Scheduled Saver requires a positive scheduled contribution amount.
- Fixed-term rates are not returned unless their approval state is `approved`.
- SQL source copy is retained under `supabase/operations/osusu_savings_catalogue_and_customer_workflows.sql`.

## Not yet enabled
- Contributions, withdrawals, internal wallet-to-savings transfers and savings ledger subaccounts.
- Automated debit collection, reminders and missed-payment handling.
- Interest accrual, payout, compounding, early withdrawal, penalties and maturity processing.
- Group Osusu invitations, member permissions, payout order and disputes.
- User-facing statement/export and savings transaction timeline.

These remain disabled rather than simulated. They require complete ledger posting workflows, operational controls, payment funding paths, reconciliation and approved customer terms. No customer funds should be collected or promised as returns until the applicable Sierra Leone and cross-border regulatory position, partner permissions, safeguarding and consumer disclosures are confirmed.

## Verification performed
- Verified the new private table and columns exist in the DVL Projects Supabase database.
- Verified the three customer RPCs are SECURITY DEFINER with empty search paths and EXECUTE granted to authenticated/service_role but not anon/PUBLIC.
- Ran an authenticated-role rollback-only test: catalogue read, plan creation and customer plan listing succeeded; the test plan was rolled back and a follow-up query confirmed no test record remained.
- Supabase security advisor continues to report the existing informational RLS-without-policy findings for private Osusu tables (expected while those tables have no browser grants) and pre-existing DVL public-schema function warnings. No unrelated DVL functions or tables were changed.
