# Supabase + Vercel setup

## 1. Create the database

1. Create a new Supabase project.
2. Open the SQL Editor and run the complete contents of `supabase/migrations/001_initial_schema.sql` **once** against the new project.
3. Run `supabase/seed.sql` to add the nine sample products.
4. In Auth settings, enable **anonymous sign-ins** for guest checkout and **email authentication** for account and staff sign-in. Enable **manual identity linking** for upgrading a guest account to an email account. Guest upgrade verifies the email first, then adds a password, following the [Supabase anonymous-user guidance](https://supabase.com/docs/guides/auth/auth-anonymous).
5. In Auth URL configuration, set the customer website as the Site URL, and allow `http://127.0.0.1:3000/account/setup` plus your production `https://YOUR-STORE-DOMAIN/account/setup` redirect. The default Supabase confirmation-link email template is supported.
6. Under database publications, check that `orders` and `order_board` are enabled in `supabase_realtime`. The migration adds them if the standard publication exists. These are the two tables the application subscribes to. See [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
7. Copy the project URL and **publishable** key from the project connection/API settings.

Do not disable RLS. Do not grant anonymous write access. `place_order` and `update_order_status` are the supported mutation functions. No browser service-role key is needed.

## 2. Connect locally

Copy `.env.example` to `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLIC-PUBLISHABLE-KEY
NEXT_PUBLIC_BOARD_URL=
ORDER_BOARD_ONLY=false
```

Restart the development server after changing these values. The public variables are embedded at build time, so redeploy after changing them in Vercel. Both empty means demo; a partial configuration shows an error and does not silently fall back to demo.

```sh
npm ci
npm run dev
```

## 3. Add your first staff member

Create a confirmed email/password user in the Supabase Auth user-management screen, or use the customer signup/confirmation/password flow. Copy that user’s ID.

Run this in Supabase SQL Editor, replacing the example UUID with the actual staff user ID:

```sql
insert into public.staff_members (user_id)
values ('REPLACE-WITH-THE-ACTUAL-AUTH-USER-UUID');
```

Visit `/dashboard` and sign in with that staff account. Customer sign-up never grants staff access. To remove crew access:

```sql
delete from public.staff_members
where user_id = 'REPLACE-WITH-THE-ACTUAL-AUTH-USER-UUID';
```

## 4. Deploy the customer website to Vercel

1. Put this project folder into a Git repository and push it to your Git provider.
2. Import that repository as a new Vercel project.
3. Choose **Next.js** as the framework. If the repository contains a parent directory, select the directory containing this `package.json` as the Root Directory.
4. Use a Node.js version of 22 or newer. The standard install/build settings work: `npm ci`, `npm run build`. Leave the output directory at its Next.js default.
5. Add the two Supabase environment variables above to the desired Vercel environments. Keep `ORDER_BOARD_ONLY=false` for this project.
6. Deploy, then add the final Vercel/custom domain to Supabase Auth URL configuration, including `/account/setup` as an allowed redirect.
7. Place an order in one browser, sign in as staff in another, and check both the tracker and `/board` while changing status.

Vercel supports this directly using its [Next.js integration](https://vercel.com/docs/frameworks/full-stack/nextjs).

## 5. Host the token display as another website

The screen already works at `https://YOUR-STORE-DOMAIN/board`. For a separate website such as `https://screen.YOUR-DOMAIN`:

1. Import the **same repository** into a **second Vercel project**.
2. Add the **same Supabase URL and publishable key**, pointing to the same database.
3. Set `ORDER_BOARD_ONLY=true` in this second project and deploy. Its root `/` serves the full-screen pickup board.
4. Assign your display subdomain in this second project’s Vercel domain settings.
5. In the original customer project, set `NEXT_PUBLIC_BOARD_URL=https://YOUR-SCREEN-DOMAIN`, then redeploy. Customer “pickup screen” links now open that website.

The display needs no staff sign-in. It receives only token, status, timestamps and an order UUID from `order_board`. Delivery orders and customer details do not enter that table. The secondary build still contains the same source routes; database authorization protects staff and private orders on either host.

**Separate domains synchronize only when Supabase is connected.** Browser-only demo storage cannot synchronize two Vercel domains.

## Live-store configuration

- Replace sample prices, menu content, address, opening hours, supported postcodes, and promotional copy.
- Use Supabase `store_settings` for delivery fee/threshold/postcodes; checkout displays these values and the database validates them again.
- Configure email delivery in Supabase for real account confirmations. Supabase’s default test email service has delivery and rate limitations.
- Guest sign-ins create Auth users. The order RPC limits submissions to 5 per customer per 15 minutes. Configure appropriate Auth rate limits and monitor usage before opening the store publicly. CAPTCHA is not wired in this version; enabling mandatory CAPTCHA requires adding a supported challenge widget and passing its token to Auth.
- Perform the hosted checks in `QA.md`. Local tests do not verify Supabase’s hosted authentication or WebSocket delivery.
- Coordinate cash collection and drivers operationally. This application does not purchase or book delivery services.
