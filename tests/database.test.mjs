// A real PostgreSQL engine in memory. Auth roles are simulated; hosted Auth and
// Realtime still require a Supabase integration check after configuration.
import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const db = new PGlite();
let checks = 0;
const A = randomUUID(),
  B = randomUUID(),
  STAFF = randomUUID();
async function check(name, fn) {
  await fn();
  checks++;
  console.log(`PASS ${name}`);
}
async function asRole(role, user, sql, params = []) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    user || "",
  ]);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
const customer = (user, sql, params) =>
  asRole("authenticated", user, sql, params);
const requestIds = [];
async function place(user, options = {}) {
  const request = options.request || randomUUID();
  requestIds.push(request);
  const result = await customer(
    user,
    "select public.place_order($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) as id",
    [
      request,
      options.mode ?? "pickup",
      options.name ?? "Test Customer",
      "9876543210",
      "10 Example Street, Indiranagar",
      options.postcode ?? "560038",
      "Test kitchen note",
      JSON.stringify(
        options.items ?? [{ product_id: "golden-classic", quantity: 1 }],
      ),
      options.total ?? 22900,
    ],
  );
  return result.rows[0].id;
}
const update = (user, id, status) =>
  customer(user, "select public.update_order_status($1,$2)", [id, status]);
try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/001_initial_schema.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
  );
  await db.query("insert into auth.users(id) values ($1),($2),($3)", [
    A,
    B,
    STAFF,
  ]);
  await db.query("insert into public.staff_members(user_id) values ($1)", [
    STAFF,
  ]);
  await check("anonymous visitors can read the menu", async () =>
    assert.equal(
      (await asRole("anon", null, "select * from public.products")).rows.length,
      9,
    ),
  );
  await check("anonymous visitors cannot read private orders", () =>
    assert.rejects(
      asRole("anon", null, "select * from public.orders"),
      /permission denied/,
    ),
  );
  await check("anonymous visitors cannot call checkout", () =>
    assert.rejects(
      asRole(
        "anon",
        null,
        "select public.place_order(null,null,null,null,null,null,null,null,null)",
      ),
      /permission denied/,
    ),
  );
  const pickup = await place(A);
  const firstRequest = requestIds[0];
  await check("pickup order is created atomically with one item", async () => {
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.order_items where order_id=$1",
          [pickup],
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("select total from public.orders where id=$1", [pickup]))
        .rows[0].total,
      22900,
    );
  });
  await check("retrying checkout returns the same order", async () =>
    assert.equal(await place(A, { request: firstRequest }), pickup),
  );
  await check("customers can see their own order", async () =>
    assert.equal(
      (await customer(A, "select * from public.orders")).rows.length,
      1,
    ),
  );
  await check("another customer cannot see the order", async () =>
    assert.equal(
      (await customer(B, "select * from public.orders")).rows.length,
      0,
    ),
  );
  await check("another customer cannot see order items", async () =>
    assert.equal(
      (await customer(B, "select * from public.order_items")).rows.length,
      0,
    ),
  );
  await check("customer cannot read or edit staff membership", () =>
    assert.rejects(
      customer(A, "select * from public.staff_members"),
      /permission denied/,
    ),
  );
  await check("customer cannot change an order directly", () =>
    assert.rejects(
      customer(A, "update public.orders set status='completed'"),
      /permission denied/,
    ),
  );
  await check("customer cannot update status via RPC", () =>
    assert.rejects(update(A, pickup, "preparing"), /Only authorized staff/),
  );
  await check("customer cannot edit menu prices", () =>
    assert.rejects(
      customer(A, "update public.products set price=1"),
      /permission denied/,
    ),
  );
  await check("forged total is rejected", () =>
    assert.rejects(place(A, { total: 1 }), /prices or delivery fees changed/),
  );
  await check("invalid postcode is rejected", () =>
    assert.rejects(
      place(A, { mode: "delivery", postcode: "999999", total: 27800 }),
      /do not deliver/,
    ),
  );
  await check("negative quantities are rejected", () =>
    assert.rejects(
      place(A, { items: [{ product_id: "golden-classic", quantity: -1 }] }),
      /Invalid item/,
    ),
  );
  await check("fractional quantities are rejected", () =>
    assert.rejects(
      place(A, { items: [{ product_id: "golden-classic", quantity: 1.5 }] }),
      /Invalid item/,
    ),
  );
  await check("missing quantities are rejected", () =>
    assert.rejects(
      place(A, { items: [{ product_id: "golden-classic" }] }),
      /Invalid item/,
    ),
  );
  await check("duplicate product lines are rejected", () =>
    assert.rejects(
      place(A, {
        items: [
          { product_id: "golden-classic", quantity: 1 },
          { product_id: "golden-classic", quantity: 1 },
        ],
        total: 45800,
      }),
      /duplicate/,
    ),
  );
  await check("empty bags are rejected", () =>
    assert.rejects(place(A, { items: [] }), /between 1 and 50/),
  );
  await check("unavailable items are rejected", async () => {
    await db.exec(
      "update public.products set available=false where id='golden-fries'",
    );
    await assert.rejects(
      place(A, {
        items: [{ product_id: "golden-fries", quantity: 1 }],
        total: 9900,
      }),
      /no longer available/,
    );
    await db.exec(
      "update public.products set available=true where id='golden-fries'",
    );
  });
  await check(
    "failed submissions leave no orders or orphan tokens",
    async () => {
      assert.equal(
        (await db.query("select count(*)::int as n from public.orders")).rows[0]
          .n,
        1,
      );
      assert.equal(
        (await db.query("select count(*)::int as n from public.order_board"))
          .rows[0].n,
        1,
      );
    },
  );
  const delivery = await place(B, { mode: "delivery", total: 27800 });
  await check("delivery fee is calculated in the database", async () =>
    assert.equal(
      (
        await db.query("select delivery_fee from public.orders where id=$1", [
          delivery,
        ])
      ).rows[0].delivery_fee,
      4900,
    ),
  );
  await check("delivery orders never appear on the pickup screen", async () =>
    assert.equal(
      (
        await asRole(
          "anon",
          null,
          "select * from public.order_board where order_id=$1",
          [delivery],
        )
      ).rows.length,
      0,
    ),
  );
  await check("public screen contains only safe token fields", async () =>
    assert.deepEqual(
      Object.keys(
        (await asRole("anon", null, "select * from public.order_board"))
          .rows[0],
      ).sort(),
      ["order_id", "token", "status", "created_at", "updated_at"].sort(),
    ),
  );
  await check("staff can see all customers' orders", async () =>
    assert.equal(
      (await customer(STAFF, "select * from public.orders")).rows.length,
      2,
    ),
  );
  await check("tokens are unique across orders", async () =>
    assert.equal(
      (
        await db.query(
          "select count(distinct token)::int as n from public.orders",
        )
      ).rows[0].n,
      2,
    ),
  );
  await check("pickup cannot skip preparation", () =>
    assert.rejects(update(STAFF, pickup, "ready"), /not allowed/),
  );
  await update(STAFF, pickup, "preparing");
  await update(STAFF, pickup, "ready");
  await check("ready status reaches the public projection", async () =>
    assert.equal(
      (
        await asRole(
          "anon",
          null,
          "select status from public.order_board where order_id=$1",
          [pickup],
        )
      ).rows[0].status,
      "ready",
    ),
  );
  await update(STAFF, pickup, "completed");
  await check("completed pickup cannot be moved backwards", () =>
    assert.rejects(update(STAFF, pickup, "preparing"), /not allowed/),
  );
  await update(STAFF, delivery, "preparing");
  await check("delivery cannot enter pickup-ready state", () =>
    assert.rejects(update(STAFF, delivery, "ready"), /not allowed/),
  );
  await update(STAFF, delivery, "out_for_delivery");
  await update(STAFF, delivery, "completed");
  const cancelled = await place(A);
  await update(STAFF, cancelled, "cancelled");
  await check("cancelled token is removed from the screen", async () =>
    assert.equal(
      (
        await asRole(
          "anon",
          null,
          "select * from public.order_board where order_id=$1",
          [cancelled],
        )
      ).rows.length,
      0,
    ),
  );
  const freeDelivery = await place(B, {
    mode: "delivery",
    items: [{ product_id: "golden-meal", quantity: 2 }],
    total: 69800,
  });
  await check("free delivery threshold is enforced", async () =>
    assert.equal(
      (
        await db.query("select delivery_fee from public.orders where id=$1", [
          freeDelivery,
        ])
      ).rows[0].delivery_fee,
      0,
    ),
  );
  await place(A);
  await place(A);
  await place(A);
  await check("customer rate limit blocks a sixth order", () =>
    assert.rejects(place(A), /several orders recently/),
  );
  await check("old tokens are hidden by the database policy", async () => {
    await db.exec(
      "update public.order_board set created_at=now()-interval '25 hours'",
    );
    assert.equal(
      (await asRole("anon", null, "select * from public.order_board")).rows
        .length,
      0,
    );
  });
  console.log(
    `\n${checks} database checks passed. Hosted Auth and Realtime were not tested.`,
  );
} finally {
  await db.close();
}
