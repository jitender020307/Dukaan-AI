# DukaanAI

Store dashboard for inventory, barcode lookup, sales, and customer Khata. Supabase Auth is used for sign-in and Supabase Postgres is the source of truth for store data.

## Run locally

Prerequisites: Node.js with npm.

1. Configure Supabase in `.env.local` using the project URL and a publishable key:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

2. Apply the additive schema in `supabase/migrations/20261024190000_store_operations.sql` to the connected Supabase project. Existing profiles and stores are retained.
3. Install dependencies and start the UI:

   ```sh
   npm install
   npm run dev
   ```

   Open `http://localhost:3001`. Sign in with an existing Supabase Auth account that has a matching `public.profiles` row and `store_id`.

## Connected workflows

- Product lists, stock, sales, customers, and ledger entries load from Supabase; the UI does not silently fall back to demo records.
- Store membership is enforced by row-level security. Existing `owner`, `manager`, and `staff` roles remain in `profiles.role`. All three roles can operate inventory, sales, and Khata as requested.
- Barcode scanners that type digits and send Enter can find an inventory item or add it to the current bill. A scan alone never changes stock.
- Saving a sale calls an atomic database function that checks stock, writes the bill and line items, decrements inventory, records the stock audit entries, and writes a Khata charge when payment is Khata.
- Manual stock changes and Khata entries are recorded in separate audit/ledger tables through database functions.
- The client uses only the Supabase publishable key. Never put a service-role key in the frontend or commit it.

