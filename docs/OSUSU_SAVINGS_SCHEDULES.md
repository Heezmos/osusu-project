# Savings schedules and reminders

## Implemented
- Customer can select flexible, daily, weekly or monthly contribution cadence.
- Customer can set a planned contribution amount and next due date.
- Customer can enable or disable the reminder preference.
- Authenticated RPC `public.osusu_update_savings_schedule` validates plan ownership, active status, cadence, amount and future due date.
- Schedule changes are audited and create an in-app notification in the customer notification inbox. The RPC always forces `auto_contribute=false`.
- Added authenticated notification-list and mark-as-read RPCs; anonymous access is denied and notifications are user-scoped.
- Customer savings response includes next due date and reminder preference.
- Schedule editor is available on each savings plan card.

## Important distinction
This release stores schedule preferences and due dates, and creates an in-app notification when the customer changes a schedule. It does not automatically debit a wallet, execute a contribution, or deliver a timed push/email/SMS reminder. The Supabase project does not currently have pg_cron/pg_net installed, and no reminder delivery worker/scheduler has been configured. Do not represent reminder preferences as delivered reminders.

## Next
- Configure a trusted scheduled worker (Supabase scheduled Edge Function or Vercel Cron) with server-side credentials and a secret.
- Add an idempotent reminder queue with a unique key per plan and due date.
- Deliver in-app notifications first, then opt-in email/SMS via approved providers.
- Keep auto-collection disabled until explicit mandate, provider integration, legal approvals and customer consent exist.
