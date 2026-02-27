/**
 * List unique X handles from landing exports where the user never signed up.
 * Cross-checks against the user table to exclude anyone with an account.
 * Excludes handles already contacted (stored in scripts/.contacted-handles).
 * New results are automatically appended to the contacted list.
 *
 * Usage:
 *   npx tsx scripts/landing-handles.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const CONTACTED_FILE = join(__dirname, ".contacted-handles");

function loadContacted(): Set<string> {
  if (!existsSync(CONTACTED_FILE)) return new Set();
  const content = readFileSync(CONTACTED_FILE, "utf-8").trim();
  if (!content) return new Set();
  return new Set(content.split("\n").map((h) => h.trim().toLowerCase()));
}

function saveContacted(existing: Set<string>, newHandles: string[]) {
  for (const h of newHandles) existing.add(h.toLowerCase());
  writeFileSync(CONTACTED_FILE, [...existing].join("\n") + "\n");
}

async function main() {
  const contacted = loadContacted();

  const result = await pool.query(`
    SELECT DISTINCT eu.handle
    FROM export_usage eu
    WHERE eu.source = 'landing'
      AND eu.handle IS NOT NULL
      AND eu.handle != ''
      AND eu."userId" IS NULL
      -- Exclude handles that appear in other exports with a userId
      AND eu.handle NOT IN (
        SELECT DISTINCT eu2.handle
        FROM export_usage eu2
        WHERE eu2."userId" IS NOT NULL
          AND eu2.handle IS NOT NULL
      )
      -- Exclude handles that match any registered user name (case-insensitive)
      AND NOT EXISTS (
        SELECT 1 FROM "user" u
        WHERE LOWER(u.name) = LOWER(REPLACE(eu.handle, '@', ''))
          OR LOWER(u.name) = LOWER(eu.handle)
      )
    ORDER BY eu.handle ASC
  `);

  const allHandles = result.rows.map((r) => r.handle.replace(/^@/, ""));
  const newHandles = allHandles.filter((h) => !contacted.has(h.toLowerCase()));

  if (newHandles.length === 0) {
    console.log("No new handles found.");
  } else {
    console.log(newHandles.map((h) => `@${h}`).join(", "));
    console.log(`\n${newHandles.length} new handles`);
    saveContacted(contacted, newHandles);
    console.log(`(saved to ${CONTACTED_FILE})`);
  }

  await pool.end();
}

main().catch(console.error);
