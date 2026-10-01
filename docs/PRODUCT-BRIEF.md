# AdPartners.kz — Product Brief (post-diploma)

**Date:** 2026-10-01 · **Method:** ECC `product-lens` diagnostic + `frontend-design-direction`, decided through a structured interview with the team.
**Status:** Diploma defended. Goal is now a real product for the Kazakhstan market. No hard deadline.

## 1. Who is it for

**Hero user: a small Kazakh brand owner** — e.g. an Almaty Instagram shop or café with no agency and a small budget, who wants local micro-influencers quickly.

Secondary user: a micro-influencer (5k–50k followers) creating Kazakh/Russian content who wants paid deals without an agency in the middle.

## 2. Pain

**Finding influencers is slow.** Today the owner scrolls Instagram/TikTok and DMs creators one at a time.

## 3. Core loop (the brand's first win)

> **Brand posts a brief in ~3 minutes → influencers apply within 24–48h → matching ranks the applicants → brand accepts one → deal → influencer submits proof link → brand confirms → both rate each other.**

Searching the catalog is secondary. Search and direct invites come after the core loop works.

## 4. Business model

| Item | Decision |
|---|---|
| Revenue | **Brand subscription** (Free / Pro) |
| Paywall | **Pro unlocks the "verified-only" filter**: only influencers whose stats an admin has checked |
| Billing | **Manual**: brand pays by Kaspi transfer/invoice; admin sets the plan to Pro with an expiry date. No payment integration. |
| Deal money | Settled **off-platform** between brand and influencer |

## 5. Cold start

**Seed brands first.** Sign 5–10 real brands with live paid briefs; influencers come because there is money. The team does this by hand, outside the product.

## 6. Data and trust

- Influencer stats are **self-reported plus an Instagram/TikTok insights screenshot**.
- An **admin review queue** (run by the team) approves the stats. Approval gives a **Verified** badge and locks the stats until the influencer resubmits.
- After a deal completes, both sides rate each other.

## 7. Success metric

**North star: share of briefs that receive ≥ 3 applicants within 48 hours.**
Supporting metrics: deals completed per month, share of brands posting a second brief within 30 days, number of paying brands.

## 8. Scope decisions

| In | Out (anti-goals) |
|---|---|
| Responsive web (mobile-first for influencers) | **In-app payments** (deals and subscriptions are both manual or off-platform) |
| RU + KZ + EN interface (RU default) | Instagram/TikTok API integration (later; the data model stays ready for it) |
| Email + password login, with email verification and password reset | OAuth, phone OTP, Telegram login (later) |
| Notifications: in-app bell, email, Telegram bot | WhatsApp (cost + Meta approval) |
| Admin panel: verification queue, plans, moderation | Agency/multi-brand team features (not decided; deferred) |

## 9. Design direction (frontend-design-direction)

| Step | Decision |
|---|---|
| Purpose | Brand: post a brief and choose an influencer fast. Influencer: find paid briefs and apply in one tap. |
| Audience | A brand owner on a laptop or phone between other tasks; an influencer on a phone. |
| Tone | **Creator-energetic** where creators are shown (applicant feed, influencer cards, profiles, landing). **Calm and dense** on brand workflow screens (brief wizard, applicant comparison, deal tracking, admin). |
| Memorable detail | The **applicant feed**: creator cards with a large avatar, content-preview strip, match score, and Verified badge, which the brand swipes or compares. |
| Constraints | Chakra UI v2 on Vite. Semantic tokens with light/dark themes. WCAG AA. RU/KZ text is ~30% longer than EN, so layouts must handle it. Mobile-first. |
| Anti-patterns to remove | Generic purple primary (`#7C3AED`), cards inside cards, feature descriptions written into the UI. |

## 10. Risks

1. **Kazakhstan personal-data localisation law.** Personal data of KZ citizens must be stored on servers located in Kazakhstan. This affects the choice of hosting and file storage (screenshots). *Verify with a lawyer or an official source before launch.*
2. **Supply quality.** Self-reported stats can be gamed; the admin queue is the only defence and does not scale beyond hundreds of influencers.
3. **Manual billing does not scale.** Acceptable for the first ~50 paying brands.
4. **Paywall value.** "Verified-only" is worth paying for only if enough verified influencers exist. Verification must run ahead of the paywall.
5. **Two people, no deadline.** Scope creep is the main threat. Each phase must ship something usable on its own.

## 11. Recommendation

**Go**, with the core loop as the only priority until the north-star metric is measurable on real briefs.
Next lane: the build plan in [`tasks/todo.md`](../tasks/todo.md).
