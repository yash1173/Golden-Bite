-- Run once in a NEW Supabase project's SQL Editor, as the project administrator.
-- All money is integer paise. No service-role key belongs in the browser.
begin;

create table public.products (
  id text primary key,
  name text not null,
  description text not null,
  category text not null check (category in ('Burgers','Meals','Sides','Drinks','Desserts')),
  price integer not null check (price between 1 and 1000000),
  image text not null,
  vegetarian boolean not null default false,
  badge text,
  calories integer not null default 0,
  available boolean not null default true,
  sort_order integer not null default 0
);
create table public.store_settings (
  id boolean primary key default true check (id),
  delivery_fee integer not null default 4900 check (delivery_fee between 0 and 100000),
  free_delivery_threshold integer not null default 49900 check (free_delivery_threshold >= 0),
  serviceable_postcodes text[] not null
);
insert into public.store_settings (serviceable_postcodes) values
  (array['560001','560002','560003','560004','560005','560008','560025','560034','560038','560095']);

create table public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
create sequence public.order_token_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default ('G' || nextval('public.order_token_seq')::text),
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  status text not null default 'placed' check (status in ('placed','preparing','ready','out_for_delivery','completed','cancelled')),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  address text,
  postcode text,
  notes text check (char_length(notes) <= 500),
  payment_method text not null default 'cash' check (payment_method = 'cash'),
  subtotal integer not null check (subtotal > 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  total integer not null check (total = subtotal + delivery_fee),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_id),
  check (fulfillment <> 'delivery' or (char_length(address) between 10 and 500 and postcode ~ '^[0-9]{6}$'))
);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_created_idx on public.orders(created_at desc);
create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price integer not null check (unit_price > 0),
  unique (order_id, product_id)
);
create index order_items_order_idx on public.order_items(order_id);

-- Safe, deliberately separate projection for the PUBLIC pickup screen.
-- Never add names, addresses, phone numbers, totals, or kitchen notes here.
create table public.order_board (
  order_id uuid primary key references public.orders(id) on delete cascade,
  token text not null unique,
  status text not null check (status in ('placed','preparing','ready','completed')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create index order_board_created_idx on public.order_board(created_at desc);

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_members where user_id = (select auth.uid()));
$$;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.staff_members enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_board enable row level security;

-- Explicit grants also work for projects without automatic public-schema grants.
revoke all on public.products, public.store_settings, public.staff_members,
  public.orders, public.order_items, public.order_board from public, anon, authenticated;
revoke all on sequence public.order_token_seq from public, anon, authenticated;
revoke all on sequence public.order_items_id_seq from public, anon, authenticated;
grant select on public.products, public.store_settings, public.order_board to anon, authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy public_menu on public.products for select to anon, authenticated using (true);
create policy public_settings on public.store_settings for select to anon, authenticated using (true);
create policy customer_or_staff_orders on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy customer_or_staff_items on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and
    (o.user_id = (select auth.uid()) or (select public.is_staff()))));
create policy public_recent_tokens on public.order_board for select to anon, authenticated
  using (created_at > now() - interval '24 hours');
-- No client INSERT/UPDATE/DELETE policies. All mutations pass the guarded RPCs.

create function public.sync_order_board() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.fulfillment = 'pickup' and new.status in ('placed','preparing','ready','completed') then
    insert into public.order_board(order_id, token, status, created_at, updated_at)
      values (new.id, new.token, new.status, new.created_at, new.updated_at)
      on conflict (order_id) do update set status = excluded.status, updated_at = excluded.updated_at;
  else
    delete from public.order_board where order_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_order_board() from public, anon, authenticated;
create trigger orders_sync_board after insert or update of status on public.orders
  for each row execute function public.sync_order_board();

create function public.place_order(
  p_request_id uuid,
  p_fulfillment text,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_postcode text,
  p_notes text,
  p_items jsonb,
  p_expected_total integer
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_settings public.store_settings%rowtype;
  v_subtotal integer := 0;
  v_fee integer := 0;
  v_quantity integer;
  v_seen text[] := array[]::text[];
begin
  if v_user is null then raise exception 'Start a customer session before ordering.'; end if;
  if p_request_id is null then raise exception 'A unique request ID is required.'; end if;
  -- Serialize this customer's submissions, including rate-limit and retry checks.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  select id into v_id from public.orders where user_id = v_user and request_id = p_request_id;
  if found then return v_id; end if;
  if (select count(*) from public.orders where user_id = v_user and created_at > now() - interval '15 minutes') >= 5 then
    raise exception 'You have placed several orders recently. Please wait a few minutes.';
  end if;
  if p_fulfillment is null or p_fulfillment not in ('pickup','delivery') then raise exception 'Choose pickup or delivery.'; end if;
  if p_customer_name is null or char_length(btrim(p_customer_name)) not between 2 and 80 then raise exception 'Enter a name between 2 and 80 characters.'; end if;
  if p_phone is null or p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Enter a valid 10-digit mobile number.'; end if;
  if char_length(coalesce(p_notes,'')) > 500 then raise exception 'Kitchen notes must be 500 characters or less.'; end if;
  select * into strict v_settings from public.store_settings where id = true;
  if p_fulfillment = 'delivery' then
    if p_address is null or char_length(btrim(p_address)) not between 10 and 500 then raise exception 'Enter a complete delivery address.'; end if;
    if p_postcode is null or not (p_postcode = any(v_settings.serviceable_postcodes)) then raise exception 'We do not deliver to that postcode yet. Please choose pickup.'; end if;
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Your bag must be an array of items.'; end if;
  if jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Add between 1 and 50 different items.'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object' or jsonb_typeof(v_item->'product_id') is distinct from 'string' or
       jsonb_typeof(v_item->'quantity') is distinct from 'number' or
       (v_item->>'quantity') !~ '^[0-9]{1,2}$' then raise exception 'Invalid item or quantity.'; end if;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity not between 1 and 20 then raise exception 'Choose 1 to 20 of each item.'; end if;
    if (v_item->>'product_id') = any(v_seen) then raise exception 'Combine duplicate items in your bag.'; end if;
    v_seen := array_append(v_seen, v_item->>'product_id');
    select * into v_product from public.products where id = v_item->>'product_id' and available for share;
    if not found then raise exception 'An item is no longer available. Please refresh your bag.'; end if;
    v_subtotal := v_subtotal + v_product.price * v_quantity;
  end loop;
  if p_fulfillment = 'delivery' and v_subtotal < v_settings.free_delivery_threshold then v_fee := v_settings.delivery_fee; end if;
  if p_expected_total is null or p_expected_total <> v_subtotal + v_fee then
    raise exception 'Menu prices or delivery fees changed. Refresh the page and review your bag.';
  end if;
  insert into public.orders(request_id, user_id, fulfillment, customer_name, phone, address, postcode, notes, subtotal, delivery_fee, total)
    values (p_request_id, v_user, p_fulfillment, btrim(p_customer_name), p_phone,
      case when p_fulfillment = 'delivery' then btrim(p_address) else null end,
      case when p_fulfillment = 'delivery' then p_postcode else null end,
      nullif(btrim(p_notes),''), v_subtotal, v_fee, v_subtotal + v_fee)
    returning id into v_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into strict v_product from public.products where id = v_item->>'product_id';
    insert into public.order_items(order_id, product_id, name, quantity, unit_price)
      values (v_id, v_product.id, v_product.name, (v_item->>'quantity')::integer, v_product.price);
  end loop;
  return v_id;
end;
$$;
revoke all on function public.place_order(uuid,text,text,text,text,text,text,jsonb,integer) from public, anon;
grant execute on function public.place_order(uuid,text,text,text,text,text,text,jsonb,integer) to authenticated;

create function public.update_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'Only authorized staff can update orders.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if p_status = v_order.status then return; end if;
  if p_status is null or not (
    (v_order.status = 'placed' and p_status = 'preparing') or
    (v_order.status = 'preparing' and v_order.fulfillment = 'pickup' and p_status = 'ready') or
    (v_order.status = 'preparing' and v_order.fulfillment = 'delivery' and p_status = 'out_for_delivery') or
    (v_order.status in ('ready','out_for_delivery') and p_status = 'completed') or
    (v_order.status in ('placed','preparing') and p_status = 'cancelled')
  ) then raise exception 'This order changed or the status transition is not allowed. Refresh and try again.'; end if;
  update public.orders set status = p_status, updated_at = now() where id = p_order_id;
end;
$$;
revoke all on function public.update_order_status(uuid,text) from public, anon;
grant execute on function public.update_order_status(uuid,text) to authenticated;

-- Supabase provides this publication. Safely skip it in plain PostgreSQL tests.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders, public.order_board;
  end if;
end;
$$;
commit;
