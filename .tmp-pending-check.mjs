import { createClient } from "@libsql/client";

const db = createClient({ url: "file:data/lunar.db" });

const cols = await db.execute(`PRAGMA table_info(sessions)`);
console.log("session cols", cols.rows.map((r) => r.name).join(", "));

const pending = await db.execute(`
  SELECT s.status, s.paid_at, s.bill_number, s.table_id,
         o.name, o.status as item_status, o.token_number, o.created_at
  FROM order_lines o
  JOIN sessions s ON s.id = o.session_id
  WHERE o.status = 'pending_approval'
`);
console.log("pending rows", pending.rows.length);
for (const r of pending.rows) console.log(JSON.stringify(r));

const counts = await db.execute(`
  SELECT s.status, count(o.id) as c
  FROM order_lines o
  JOIN sessions s ON s.id = o.session_id
  WHERE o.status = 'pending_approval'
  GROUP BY s.status
`);
console.log("by session status", JSON.stringify(counts.rows));

const sess = await db.execute(`
  SELECT status, count(id) as c
  FROM sessions
  GROUP BY status
`);
console.log("sessions", JSON.stringify(sess.rows));
