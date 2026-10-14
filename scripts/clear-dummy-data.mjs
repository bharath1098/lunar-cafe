import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

async function wipe(label, url, authToken) {
  const client = createClient({ url, authToken });
  console.log(`Clearing ${label}...`);
  await client.executeMultiple(`
    DELETE FROM cart_lines;
    DELETE FROM order_lines;
    DELETE FROM order_batches;
    DELETE FROM session_members;
    DELETE FROM sessions;
    DELETE FROM reservations;
    DELETE FROM feedback;
    DELETE FROM audit_log;
    DELETE FROM loyalty;
    UPDATE settings SET next_bill_number = 1, next_token_number = 1 WHERE id = 1;
    UPDATE tables SET assigned_waiter_id = NULL;
  `);
  const sessions = await client.execute("SELECT COUNT(*) AS c FROM sessions");
  const paid = await client.execute(
    "SELECT COUNT(*) AS c FROM sessions WHERE paid_at IS NOT NULL",
  );
  console.log(
    `  ${label}: sessions=${sessions.rows[0].c ?? sessions.rows[0][0]} paid=${paid.rows[0].c ?? paid.rows[0][0]}`,
  );
  client.close();
}

const env = loadEnvLocal();
const localUrl = `file:${path.join(process.cwd(), "data", "lunar.db").replace(/\\/g, "/")}`;

await wipe("local file", localUrl);

if (env.TURSO_DATABASE_URL?.startsWith("libsql://")) {
  await wipe("Turso", env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
} else {
  console.log("Turso URL not set — skipped remote wipe.");
}

console.log("Done. Restart npm run dev so memory cache is dropped.");
