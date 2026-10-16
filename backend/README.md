# Second Act — live graph-backed inventory

This backend connects to FalkorDB Cloud, serves the website on localhost, and answers live resource-search requests. It uses the official FalkorDB Node.js client and Node's built-in HTTP server.

## Your local setup

The private `backend/.env` file in the Desktop project folder is pre-filled with the Cloud connection address supplied in chat. It is not included in the browser preview or committed source. Add your **database password** to its empty `FALKORDB_PASSWORD` value. Keep this file private.

The matching public setup template is `.env.example`. The `.gitignore` files exclude `.env`, dependencies and logs from source control. Never copy the private `.env` into the publicly served preview folder.

## Check the database

From this backend folder, run:

```powershell
npm run check:db
```

The check authenticates and lists graph metadata. It does not create, alter or delete records. The success message is printed only after FalkorDB actually responds. Missing credentials, login rejection and network problems produce a failure message and a nonzero exit code. Passwords and raw driver errors are not printed.

For a fresh checkout, install the locked dependencies with `npm ci --ignore-scripts`, copy `.env.example` to `.env`, then fill in the real database connection details.

## Connection settings

- `FALKORDB_URL`: the connection address from FalkorDB Cloud, including the username and port.
- `FALKORDB_PASSWORD`: the database password; separate from the address.
- `FALKORDB_TLS=auto`: follows the URL protocol. `falkor://` and `redis://` use plain TCP; `falkors://` and `rediss://` use TLS. Set `true` if the dashboard explicitly supplies a TLS connection. The checker never silently falls back to an unencrypted connection and never disables certificate checks.
- `FALKORDB_GRAPH=second_act`: the graph name to use when building the inventory later. The checker does not create it.

## Run the website

From this folder:

```powershell
npm run seed
npm start
```

Open http://127.0.0.1:4318/. Keep only one preview/server process running on that port. The new backend uses the same address as the original frontend preview, preserving the browser's local profiles and briefs. It serves an explicit allowlist of frontend files and image/font assets. Private settings, backend source, installed dependencies and directory listings are not served.

The seeder uses `MERGE` and stable `second-act-demo-v1:` IDs. It updates only its own fictional sample records and never deletes existing data. Rerunning it does not duplicate the inventory. All sample names, clubs, equipment and bookings are fictional. It does not upload the user's profile or project text.

## Try the live search

Choose Photography, open the project brief, and scroll to **Make more. With what's here.** Click **Try the backdrop demo** to search October 25–27, 2026. The blue backdrop fabric is booked; teal curtains and foam boards are available. Use **Find available alternatives** on a booked item to follow its shared creative-use relationships and find replacements.

Camera equipment for those dates also demonstrates a dependency: the camera body is available by itself, but its required lens is booked, so the kit is unavailable. On October 28–30 both are available. The displayed kit cost includes the required lens.

Manual search costs are per listed resource and requested quantity across the inclusive date range. Availability uses peak concurrent bookings, not the sum of reservations on unrelated days. Searches are read-only and do not create bookings. Borrowing requests, saved cloud projects, online authentication and public hosting are future steps.

## Verification

```powershell
npm test
npm run check:inventory
```

The unit checks cover overlapping versus separate bookings, inclusive dates, cancelled bookings, invalid dates and quantities, and zero budgets. The live inventory checks cover real graph queries for replacements, equipment dependencies, total kit costs, quantities and the demo record count.

## API

- `GET /api/health`: confirms a live graph response and demo resource count.
- `GET /api/catalog`: lists creative disciplines and supported resource purposes.
- `GET /api/resources?discipline=photography&purpose=backdrop&start=2026-10-25&end=2026-10-27&quantity=1&includeUnavailable=true`: queries connected resources and date availability.
- Optional `budget=0` filters to free items. Optional `sourceId=<resource id>` finds alternatives through a shared creative use; set `includeUnavailable=false` for available replacements only.

Invalid inputs return 400, unavailable inventory returns 503, and unknown routes return 404. Database queries use parameters. No arbitrary query or inventory-mutation API is exposed.

See `GRAPH-MODEL.md`, `seed.mjs` and `search.mjs` for the model and concrete Cypher queries.

Official Node.js client: https://github.com/FalkorDB/falkordb-ts

## Creative planner

Add `GEMINI_API_KEY` to the private `.env`. `GEMINI_MODEL` defaults to `gemini-3.1-flash-lite`, which successfully generated a test response with this project's key. The project was observed as Free tier in AI Studio. Free model access and quotas depend on Google's current account limits; this code does not enable billing or fall back to a paid provider. Google documents its free tier at https://ai.google.dev/gemini-api/docs/billing and model pricing at https://ai.google.dev/gemini-api/docs/pricing.

`POST /api/plan` accepts `discipline`, `title`, `vision`, `resources`, `start`, optional `end` and optional `budget` (INR; zero is preserved). Briefs are limited in size, dates to 30 days, agent rounds to six, and tool calls to twelve. The local server limits concurrent generation and requests per minute. These are demo safeguards, not public authentication or a complete production abuse-control system.

The Gemini function-calling loop runs entirely in `planner.mjs`. The first turn must call `search_resources`; subsequent turns may call `find_alternatives` and `finish_plan`. Every search uses the live FalkorDB graph with parameterized queries. The model has no arbitrary database query or write tool. Full model parts, including thought signatures, are retained only for the in-memory request conversation. The browser receives a concise tool trace, not hidden model reasoning.

`verifyPlan` accepts only observed, available resource IDs. It checks quantities, required-equipment stock, combined resource cost, and the complete budget, and counts required equipment only once if selected explicitly. Creative instructions, assumptions and gaps remain AI-generated and should be reviewed. No stock is reserved, no cloud project is saved and no personal profile is sent. Google may use free-tier inputs to improve products under its terms, so use fictional demo briefs rather than sensitive material.

Run `npm run check:ai` for a small synthetic generation test and `npm run check:planner` for a live Gemini + FalkorDB photography workflow. Both consume API quota. `npm test` runs deterministic stock and planner-verification checks without any model calls. Raw provider responses and credentials are never logged.
