# CLAUDE.md

Guidance for Claude Code when working in this project and for this user.

## Content Writing / Copy

- When writing marketing/website copy, always source content from the actual live website (not Notion or other internal docs).
- Avoid AI-sounding patterns like "X, not Y" antithesis, empty superlatives, and filler phrases; match the existing brand voice.

## Research & Recommendations

- For product comparisons and purchase decisions, verify claims (prices, sale offers, specs) against live/current sources.
- Confirm which catalog applies (e.g. B2B vs public e-shop) before recommending.

## Deployment

- Before deploying to Vercel, use the production domain rather than preview URLs (which are gated behind deployment protection/login).
- Verify the final page loads without auth.

## Data Lookups

- When looking up event/registration codes or account-specific data, confirm the code is valid for the specific event/context before presenting it as an answer.
