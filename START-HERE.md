# Second Act — try the connected website

Open http://127.0.0.1:4318/. Refresh if you already had the older preview open.

1. Click anywhere to start the lips sequence, or use Skip.
2. Create your profile if this is your first visit.
3. Choose Photography and continue to the project brief.
4. Click **Try a ₹500 portrait brief** to fill an example. This does not call the AI yet.
5. Click **Make my creative plan**. Gemini searches FalkorDB and follows the available alternatives.
6. Read the creative approach, production steps, resource bill and unresolved needs. Expand **Why these choices?** for the actual resource checks.
7. You can also use **Make more. With what's here.** below the plan for manual searches. **Try the backdrop demo** shows the booked blue fabric and lets you request alternatives.

You can change the dates, quantity, purpose and project budget to see the live results change. Camera equipment demonstrates a required-lens dependency. Profiles and briefs remain saved on this device; searches read the fictional inventory from FalkorDB Cloud.

## Restarting later

Open a terminal in this project's `backend` folder and run `npm start`, then open the same website address. One server can use that address at a time. The existing preview has already been started for this session.

Keep `backend/.env` private. It contains your database password and is excluded from Git and the website's served files.

The creative planner uses Gemini 3.1 Flash-Lite. It sends your project brief and retrieved fictional inventory to Google, without your profile. A key with access and available quota is required; billing has not been enabled by this project. The generated plan is a starting point: stock is checked at generation time, no reservations are made, and unpriced project expenses are excluded. Public deployment, cloud project storage and actual borrowing requests remain future work.
