# DukaanAI

Store dashboard for inventory, barcode lookup, sales, and customer Khata. Supabase Auth is used for sign-in and Supabase Postgres is the source of truth for store data.

## Run locally

Prerequisites: Node.js with npm.

1. Configure Supabase in `frontend/.env.local` (Vite runs from `frontend/`) using the project URL and a publishable key. Copy `frontend/.env.example` to start:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

2. Apply every file in `supabase/migrations/` in timestamp order with the Supabase SQL editor:
   1. `20261023171727_rbac_foundation.sql` — creates `stores` and `profiles` with RLS and the owner/manager/staff roles.
   2. `20261023172234_rbac_security_hardening.sql` — moves the profile trigger to a private schema and lets members read their own store.
   3. `20261024190000_store_operations.sql` — products, customers, sales, Khata, and audit tables plus the store RPCs.
   4. `20261024191000_restrict_anon_rpc.sql` — revokes anonymous execution on the RPCs.

3. Create the first auth user in Supabase Authentication, then follow the bootstrap SQL comments at the end of the `rbac_foundation` migration to create the store and assign that user as Owner.
4. Install dependencies and start the UI:

   ```sh
   npm install
   npm run dev
   ```

   Open `http://localhost:3001`. Sign in with the Supabase Auth account that has a matching `public.profiles` row and `store_id`.

### Backend demo API (optional)

The Python demo API (`backend/server.py`) verifies the Supabase access token and the caller's store role on protected endpoints and offers owner-only team management endpoints. Run it with `python backend/server.py [port]` (default port 8000; Vite proxies `/api/*` to it). Copy `backend/.env.example` to `backend/.env` and set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY`. Never expose the secret key in frontend variables.

## Connected workflows

- Product lists, stock, sales, customers, and ledger entries load from Supabase; the UI does not silently fall back to demo records.
- Store membership is enforced by row-level security. Existing `owner`, `manager`, and `staff` roles remain in `profiles.role`. All three roles can operate inventory, sales, and Khata as requested.
- Barcode scanners that type digits and send Enter can find an inventory item or add it to the current bill. A scan alone never changes stock.
- Saving a sale calls an atomic database function that checks stock, writes the bill and line items, decrements inventory, records the stock audit entries, and writes a Khata charge when payment is Khata.
- Manual stock changes and Khata entries are recorded in separate audit/ledger tables through database functions.
- The client uses only the Supabase publishable key. Never put a service-role key in the frontend or commit it.

