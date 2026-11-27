# Findings & Decisions

## Requirements
- Fix the authenticated Mercado Livre report's SSR refresh error (`unref(...).getState is not a function`).
- Load history beyond the first 500 orders / 30-day-looking cutoff.
- Make Ranking de Produtos/Anúncios and Mercado Ads availability diagnosable rather than silently empty.

## Research Findings
- `@tanstack/vue-table@9.2.4` exposes pagination through `table.atoms.pagination.get()`; the report table's `getState()` call is invalid for this version.
- The sync service had a hard 500-order cap with no continuation, consistent with the incomplete history symptom.
- Product Ads request failures were swallowed and presented as empty results.
- Product Ads integration cannot be verified against the authenticated production account here; the code now logs API failures and shows an explicit dashboard warning when advertiser/metrics data is unavailable.
- Order sync follows offsets with a fixed date boundary and caps each request at 500 orders; the UI continues through all returned batches.
- The production build completes; all 37 tests, typecheck, and focused source lint/format checks pass.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use bounded order batches with a stable `dateFrom` and an `offset` | Avoid serverless timeouts and keep pagination consistent across calls |
| Surface Ads sync failure and show unsupported/unavailable state | Empty metrics should not be indistinguishable from request failure |
| Fetch the external API response as `unknown` before returning it through the typed helper | Avoid Nitro's internal-route response typing conflict while keeping the helper's existing response contract |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Full lint/format scope includes unrelated `.agents/skills/` files | Focus on changed files and report the repository-wide baseline failure |
| Public production route redirects to login | Authenticated production behavior cannot be validated without a session |
| Product Ads account/campaign response unavailable locally | Confirm advertiser and campaign status in production after deployment |

## Resources
- `server/utils/mercadolivre-sync.ts`
- `app/pages/reports/mercadolivre.vue`
- `app/components/reports/mercadolivre/MlProductsTable.vue`
- `server/utils/mercadolivre-api.ts`
