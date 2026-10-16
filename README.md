# The Second Act — make your entrance

A working, responsive creative onboarding flow and creative planner: curtain-and-spotlights intro, local profile creation, four-discipline selection, a project brief, live FalkorDB resource search, and a Gemini agent that makes a plan using verified inventory. The current category artwork is the four `*_pop_v3.png` images supplied by the user. Unused artwork and preview screenshots have been removed.

## Open

Requires Node.js 22.9 or newer and a reachable FalkorDB instance. To run a fresh checkout:

1. Open the `backend` folder and run `npm ci --ignore-scripts`.
2. Copy `.env.example` to `.env` and fill in your FalkorDB connection, password and Gemini API key. Keep this file private. Manual resource search works without a Gemini key.
3. Run `npm run seed` to create the fictional ten-resource demo graph.
4. Run `npm start` and open http://127.0.0.1:4318/.

On the original computer, the Desktop project's private settings are already configured. Internet access is required for the cloud services and optional Google Fonts; system fonts provide a typography fallback. This is currently a local demonstration, with no public deployment or production authentication.

Opening `index.html` directly previews the intro, local profile and brief. Live search and planning require the backend. Manual inventory search does not require an AI key; generating a plan requires a private Gemini key.

## Try it

- The supplied red curtains open automatically, RGB spotlights move into an overlapping “2” mark, and the title appears before the profile or saved selection menu is revealed. Use Skip or Escape to continue immediately. Reduced-motion preferences bypass the choreography.
- On your first visit, the stage reveal opens profile creation. The yellow portrait is selected by default. Click Change to choose from the six supplied portrait colours, enter your name, and make your entrance through a red transition.
- The name and selected portrait are saved in this browser on this device. Subsequent visits open the selection menu after the intro. Use the top-right profile menu and Edit profile to change either detail. This is a local profile, not an online account.
- Click a discipline or use keys 1–4.
- Continue into a short, discipline-specific creative brief.
- Save the brief locally and reopen it later through the same browser.
- Use the profile menu to reset your selected discipline.
- Open “The idea” for the product concept.
- Try a narrow window or mobile browser; the menu becomes a two-column grid.

The interface supports keyboard interaction, native radio controls, visible focus, reduced motion, and a responsive layout. Profiles and saved drafts remain in this browser. Clicking Make my creative plan sends the brief (without the profile) to the backend and Gemini. Storage availability for file URLs depends on the browser; serving over localhost gives consistent local storage behavior.

## Scope

This includes the supplied opening film, a functional local profile with six portrait choices, the selection menu, a project brief, graph-backed resource search, and AI-generated plans with verified costs and resource evidence. Online authentication, cloud-saved projects, borrowing requests and public deployment are future steps.

## Backend connection setup

The `backend/` folder contains the official FalkorDB client, live resource API, a ten-resource fictional graph, and connection/inventory checks. The Cloud connection has been verified with the private credentials in the Desktop copy. Run `npm start` from the Desktop project's backend folder and open http://127.0.0.1:4318/. Private settings are excluded from Git and from the backend's static-file allowlist. See `backend/README.md` and `backend/GRAPH-MODEL.md`.

Choose Photography, continue to the brief and click **Try a ₹500 portrait brief**, then **Make my creative plan**. Gemini chooses resource-search tools, sees the blue fabric is booked, and can follow shared creative-use relationships to available alternatives. The server verifies every selected resource, the combined resource budget and required equipment. Expand the resource checks to see the actual graph results. The manual search below remains available without an AI key. All inventory is fictional; generating a plan does not reserve anything.

## Files

- `index.html`: accessible page structure and content.
- `styles.css`: pop-art layout, responsive styles, motion, and typography.
- `app.js`: local profile creation and editing, avatar selection, screen transitions, local draft persistence, and keyboard shortcuts.
- `planner.js`: submits the brief to the backend and renders the creative plan, cost breakdown, assumptions and graph evidence.
- `interactions.js`: spring-following caret for text fields, multiline briefs and numeric entry. Native date pickers remain available. Numeric entry preserves minimum, maximum, whole-number validation and arrow-key stepping.
- `intro-engine.js`: the curtain and RGB spotlight choreography adapted from the supplied HTML.
- `intro.js`: automatic playback, reveal, skip, cleanup, scroll restoration and keyboard focus.
- `source/SecondActIntro.jsx`: the original supplied component, retained unchanged.
- `source/SecondActIntro-v2.jsx`: the latest supplied component, retained unchanged.
- `assets/`: only the four supplied v3 category images and the supplied six-portrait contact sheet. The portrait choices use CSS background positioning to display each cell without altering the supplied image. The small SVG brand mark matches the opening spotlights; the intro uses CSS without a video download.
- `ART-DIRECTION.md`: illustration prompts and provenance.

The active category and profile images were supplied by the user and copied unchanged. Earlier unused category illustrations have been deleted; their historical prompts remain in the art-direction documents. The active opening comes from the supplied curtain-and-spotlights HTML; the older JSX files are retained as historical source references.
