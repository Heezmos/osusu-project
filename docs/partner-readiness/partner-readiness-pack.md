# Osusu — Financial Institution Partnership Readiness Pack

**Status:** Internal working document  
**Market focus:** Sierra Leone first  
**Owner:** Delight Ventures  
**Product:** Osusu  
**Purpose:** Prepare Osusu to engage licensed banks, payment service providers and other appropriately authorised financial institutions. This document is not a partnership, regulatory opinion, product approval or offer to customers.

## 1. Current position and non-negotiable boundaries

Osusu is being developed as a technology-led financial services platform. Until the relevant institutional partnerships, legal structure and regulatory permissions are confirmed:

- Osusu will not accept, custody, pool, invest or disburse customer money in live operations.
- Osusu will not advertise or pay an interest rate, profit rate, yield or guaranteed return.
- No savings product will accrue, calculate as payable, credit or promise interest.
- No bank account, e-money, deposit protection, card, payment rail or partner capability will be represented as available until verified in writing.
- Product screens, sample balances and test transactions are demonstrations, not evidence of live financial services.
- Circle remains a draft group-savings coordination feature; it does not collect pooled contributions or make rotation/ROSCA payouts.

Existing savings catalogue configuration is intentionally conservative: no annual rates are configured; Fixed-Term Growth remains unavailable and pending approval; funding is disabled across the catalogue.

## 2. Partnership model to explore

The initial model to assess is **partner-backed savings and payments**:

1. A licensed institution or authorised provider holds or safeguards customer funds under its own approved product and legal framework.
2. The institution remains responsible for regulated deposit/e-money/payment activities assigned to it by law and the agreement.
3. Osusu supplies the customer-facing technology, onboarding workflow, savings goals, contribution scheduling interface, notifications, reporting and customer support functions expressly delegated to it.
4. Customer funds move only through partner-approved accounts, rails and instructions. Osusu must not route money through an unapproved company account.
5. Any interest-bearing or investment product is the partner's approved product. The partner confirms the rate, calculation method, eligibility, payment timing, fees, tax treatment, withdrawal conditions and customer disclosures in writing.
6. Osusu's revenue (for example, a technology, distribution or servicing fee) is separately agreed and disclosed where required. It must not be confused with customer interest or deducted from customer principal without a lawful, disclosed basis.

This is a model for discussion, not a conclusion that the structure is permissible. Sierra Leone counsel and the Bank of Sierra Leone should be consulted on the precise activities, licensing, outsourcing, agency, safeguarding and consumer-protection requirements before launch.

## 3. Partner profiles to approach

Prioritise institutions with demonstrable authority and operational capability in Sierra Leone:

- Commercial banks with deposit products and digital/API integration capability.
- Licensed payment service providers or mobile-money operators for approved collection and disbursement rails.
- Regulated institutions or authorised investment providers for any future investment-linked product, only after separate legal and product review.
- Card issuers/processors for Dash Card, under a separate issuer and programme agreement.

Do not assume one partner can provide all services. Osusu may need separate bank, payment, card and investment partners.

## 4. Partner capability checklist

Ask each prospective partner to confirm, with evidence:

- Legal name, jurisdiction, regulator, licence category/number, current status and permitted activities.
- Which entity legally holds customer funds and whose name appears on statements/receipts.
- Whether funds are deposits, e-money or another legally defined balance.
- Safeguarding, trust/segregation, reconciliation and insolvency treatment.
- Whether any deposit protection applies, the institution and product eligibility, limits and exclusions.
- Supported currencies (SLE/USD), payment rails, settlement windows, cut-off times and reversals.
- API documentation, sandbox, authentication, signing, idempotency, webhook retries and uptime commitments.
- KYC/CDD, AML/CFT, sanctions screening, transaction monitoring and record-retention responsibilities.
- Customer complaints, disputes, unauthorised transactions, refunds and escalation SLAs.
- Data-controller/processor roles, data residency, privacy, security certifications and breach notification.
- Fees, minimum volumes, reserves, prefunding, settlement accounts and reconciliation files.
- Outsourcing/agent approvals, audit rights, business continuity and termination/migration arrangements.
- For savings returns: approved rate and product terms, rate-change rules, day-count basis, compounding, crediting frequency, early withdrawal, tax, fees and statements.

## 5. Questions for the first partner meeting

1. Which of Osusu's proposed activities can your institution legally support under your current licence?
2. Can you provide a partner-backed savings product for SLE and/or USD customers?
3. Who holds the funds legally, and how are they safeguarded and reconciled?
4. Can customers open or link accounts through a supported digital onboarding/API flow?
5. What KYC/AML tasks must Osusu perform, and which remain with your institution?
6. Can you provide a sandbox and technical integration team?
7. What are the commercial terms, transaction fees, minimum volumes and settlement arrangements?
8. What customer disclosures and approvals must be completed before launch?
9. What are your incident, dispute, refund and customer-support responsibilities?
10. What approvals are required from your compliance team, board, regulator or other authorities before a pilot?

## 6. Operating and technical work Osusu can prepare now

These activities do not require an interest rate or live-money activation:

- Keep savings product catalogue rates null and all funding controls disabled until formally approved.
- Preserve ledger immutability, balanced journal posting, idempotency and audit trails.
- Prepare partner-neutral integration contracts for payment initiation, signed webhook verification, status polling, settlement reports and reconciliation.
- Define a partner configuration registry with legal entity, licence evidence, supported services/currencies, environment, status, effective dates and approval evidence.
- Define maker-checker approval for partner onboarding, payment limits, product activation and changes to sensitive settings.
- Design reconciliation exception queues for unmatched, duplicate, delayed, reversed and disputed transactions.
- Prepare customer-facing states that distinguish planned, pending, processing, posted, failed, reversed and disputed transactions.
- Keep all provider secrets server-side; never expose service-role credentials or provider signing secrets in browser code.
- Maintain test/sandbox separation from production and label all test money and sample figures clearly.
- Keep automatic collection disabled until a partner rail, mandate process, consent, retry policy and cancellation process are approved.

## 7. Future interest-bearing product — activation gates

No rate engine or customer rate should be activated until all gates are satisfied:

1. A named partner and verified current licence/authority.
2. Written legal and regulatory assessment of the exact product and Osusu's role.
3. Executed agreement defining custody, safeguarding, responsibilities, data, complaints, fees, liability, audit and exit.
4. Partner-approved product terms and rate schedule, including effective date and change notice.
5. Defined calculation basis (simple/compound, day-count, eligible balance, rounding), accrual and credit cadence, maturity, early withdrawal, tax and fees.
6. Customer disclosures and explicit acceptance captured with a versioned terms record.
7. Reconciliation between Osusu records and partner statements, with exception handling.
8. Independent security, operational and compliance review plus end-to-end sandbox tests.
9. Written launch approval from the accountable partner and Osusu decision-makers.

Until then, no active rate, estimated earnings, accrued payable amount or guaranteed return should be shown to customers. A purely educational calculator, if later offered, must be clearly labelled hypothetical and must not imply an available Osusu product.

## 8. Documents to request and retain

- Licence/authorisation evidence and regulator contact details.
- Corporate registration and beneficial ownership information.
- Product terms, tariff/fee schedule and customer disclosure templates.
- Safeguarding/custody explanation and deposit-protection confirmation, if applicable.
- API specifications, sandbox credentials and webhook signing guide.
- KYC/AML allocation matrix and escalation procedures.
- Data processing/security documentation and incident response plan.
- Settlement, reconciliation and dispute operating procedures.
- Draft commercial agreement, service levels and exit/portability plan.
- Written approval for any co-branding, marketing claims or use of partner name/logo.

## 9. Initial outreach email

**Subject: Partnership discussion — Osusu digital savings and payments platform**

Dear [Partnerships/Business Development Team],

Delight Ventures is developing Osusu, a digital platform intended to make savings management and selected payment services more accessible to customers in Sierra Leone.

We are exploring partnerships with appropriately licensed financial institutions to understand the services that could be delivered through a compliant partner-backed model. Areas for discussion include savings products, approved payment collection and disbursement rails, account information, reconciliation and potential future card services.

We would welcome an introductory meeting to understand your institution's capabilities, partnership requirements, compliance expectations, technical integration options and commercial model. At this stage, we are not representing that Osusu is authorised to hold customer funds or offer interest-bearing products; those capabilities would only be considered through the appropriate institutional and regulatory approvals.

Please let us know a suitable time for an introductory discussion.

Kind regards,  
**Delight Ventures**  
Osusu Project Team

## 10. Decision log

| Item | Current decision |
|---|---|
| Interest rate | Paused; no rate configured or advertised |
| Fixed-Term Growth | Unavailable pending partner, legal and product approval |
| Customer fund custody | Not enabled |
| Live deposits/withdrawals | Not enabled |
| Automatic collection | Not enabled |
| Osusu Circle | Draft coordination feature; no pooled funds or payouts |
| Partner model | Partner-backed model to investigate |
| First market | Sierra Leone |
| Launch status | Development and partner discovery; not a live financial service |

**Review this document whenever the proposed partner, product structure, regulatory guidance or technical scope changes.**
