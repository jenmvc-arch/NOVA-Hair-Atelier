<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e9629c6a-5fe5-4b0f-8cd7-86fe592df5e6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. To enable Supabase cloud saves, run [supabase_setup.sql](supabase_setup.sql) in your Supabase SQL Editor, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
4. Run the app:
   `npm run dev`

## Supabase persistence

The app saves appointments, POS cart/ticket state, transactions, clients, employees, catalog items, company settings, payment settings, notifications, appointment reminder status, reminder rules, and uploaded images/QR codes to Supabase when configured.

If Supabase is not configured or the SQL setup has not been run yet, the app automatically falls back to local browser storage.
