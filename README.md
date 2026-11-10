# Osusu — a Delight Ventures product

Osusu is a digital wallet, payments, savings and financial-management product being developed under Delight Ventures Limited (DVL). It is not a separate legal entity.

## Product structure

The five core services are:
1. Digital Wallet — SLE and USD wallet experiences.
2. Payments & Bank Services — local and eligible international payment methods, bank linking through authorised providers, and transparent FX.
3. Osusu Savings — personal goals, group Osusu circles and fixed-term plans.
4. Dash Card — virtual and physical card management, subject to an approved issuer.
5. Financial Management — spending insights, savings progress, statements and reports.

Supporting capabilities include KYC, secure account management, transaction receipts and history, payment reconciliation, notifications, reminders, customer support, interest calculators, referrals and financial reports.

## Technology direction

- Next.js App Router + TypeScript
- Supabase Auth, PostgreSQL and Edge Functions (DVL-approved project and isolated Osusu schema/tables)
- Vercel deployment
- GitHub source control

## Safety and compliance boundaries

The current application is a UI prototype. It does not accept deposits, move money, issue cards, calculate payable interest or initiate real payments. Do not connect live financial rails until DVL confirms the appropriate regulatory permissions, contracts, provider eligibility, safeguarding arrangements, KYC/AML controls and operational reconciliation. PayPal availability must be through an eligible authorised arrangement; never bypass geographic or account restrictions. Bank linking must use authorised providers and must never collect bank passwords.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required public configuration is intentionally optional while the UI prototype is being developed. Never commit secrets. See `.env.example` for placeholders.

## Status

Phase 1: repository foundation and customer dashboard prototype.
Phase 2: confirm shared DVL Supabase project architecture, isolated Osusu schema, Auth and RLS.
Phase 3: implement ledger-backed wallet and payment-provider sandbox flows.
