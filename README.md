Quickstart (Plain static site with Supabase email magic link)

1. Create a Supabase project (https://app.supabase.com)
2. In Supabase > Authentication > Settings, enable Email Auth (Magic Link) if needed.
3. Create a table named `profiles` with columns:
   - id (bigint or uuid) primary key default: gen_random_uuid() or serial
   - user_id text (unique)
   - name text
   - place text
   - birth date
   - phone text
   - education text
   - experience text
   - profession text
   - created_at timestamptz default now()

4. Copy your Supabase project URL and anon public key, then edit `main.js` and replace SUPABASE_URL and SUPABASE_ANON_KEY placeholders.
5. Deploy: push this repo to GitHub and enable GitHub Pages (serve / at root). Alternatively upload files to any static host.

Notes
- This site uses Supabase anon key on the client — that is normal. For production make sure RLS policies restrict access so users can only access their own rows.
- If you want serverless functions later for payments, add a small Node function to create Stripe Checkout sessions and host on Netlify/Vercel.

License: MIT
