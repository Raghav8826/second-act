# Free SecondAct address

Primary website: https://secondact.pages.dev/

Cloudflare Pages serves the frontend. Only `/api/*` invokes the Pages worker, which forwards approved API routes to the existing AWS Lambda backend. Gemini and FalkorDB credentials stay in AWS. No paid Cloudflare plan or purchased domain is needed for this address.

Static requests are free and unlimited. API proxy requests share the Workers Free quota of 100,000 requests per UTC day across the account. Reaching a free limit can make the API unavailable; it does not enable a paid plan. Existing AWS costs and external-provider quotas still apply. See https://developers.cloudflare.com/pages/functions/pricing/ and the root AWS-DEPLOYMENT.md.

## Update this deployment

These files belong in `deploy/cloudflare/` beneath the main project. `build.mjs` copies only the current frontend and assets into `site/`, with the API worker and missing-page handling. Never upload the whole project, backend environment files, recordings or sign-in caches.

1. Install/use official Cloudflare Wrangler (the deployed version was 4.151.1).
2. Run `node --test deploy/cloudflare/proxy.test.mjs`.
3. Run `node deploy/cloudflare/build.mjs` from the project root.
4. Sign in to the owning Cloudflare account with `wrangler login` when needed.
5. Run `wrangler pages deploy deploy/cloudflare/site --project-name secondact --branch main --commit-dirty=true`.
6. Set `SECOND_ACT_URL=https://secondact.pages.dev/` and run `node backend/check-demo.mjs`.

Deployments are direct uploads, not automatic GitHub builds. Saving or pushing code alone does not redeploy the site.

## Verified 17 October 2026

All frontend assets, all four live inventory searches (35 graph resources), and missing private-file routes passed. A real fashion plan completed through this address in 8 seconds, using graph-verified hand-sewn peacock appliqué and four available resources costing ₹105. Model responses and timing can vary.

The existing AWS address remains available as a fallback. Moving to a different origin means browser-local profiles and saved briefs from the old address do not automatically transfer; users create their profile once at the new address.
