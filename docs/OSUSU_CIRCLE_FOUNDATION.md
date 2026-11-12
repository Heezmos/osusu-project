# Osusu Circle foundation

## Customer capabilities in this release
- Create a draft savings circle with a name, currency, planned per-member amount, weekly/monthly cadence and member cap.
- Creator is recorded as the circle owner and first active member.
- Share a UUID invitation code with a 30-day expiry.
- Join a draft circle with a valid invitation code.
- View joined circles, active member count and member display names.
- Leave a circle as a non-owner member.
- Circle owner receives an in-app notification when a member joins.

## Security and operational controls
- All customer operations derive the acting user from auth.uid().
- Anonymous execute is revoked for all four customer RPCs; authenticated execute is granted.
- Circle and member tables retain RLS; no direct table grants are introduced.
- Joining locks the circle row before checking expiry and capacity to avoid overfilling under concurrent joins.
- Only the owner receives the invitation code in the circle-list response.
- Owner cannot join twice or leave their own circle.
- Audit events record creation, joining and leaving.
- Circle status remains draft. This is a coordination and membership foundation only.

## Explicitly not enabled
- No member contribution collection or pooled ledger balance.
- No rotation/ROSCA payout order, disbursement or beneficiary selection.
- No wallet debit, withdrawals, interest, fees or real-money movement.
- Circle funding must not be enabled until provider rails, KYC/AML, legal structure, member consent, safeguarding and dispute handling are designed and approved.

## Verification
- Database migration applied.
- Anonymous execute denied and authenticated execute granted for create, join, list and leave.
- RLS remains enabled on both circle and membership tables.
- Rollback-only authenticated test created a circle, verified owner membership/listing and confirmed duplicate join is rejected; transaction rolled back without retaining test data.
- Frontend preview build pending.
