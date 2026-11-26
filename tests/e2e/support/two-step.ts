import { createHmac } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Every dashboard user must pass two-step sign-in. global-setup gives each seeded e2e user an
 * authenticator app and keeps its key here, so login() can make a code like a phone would.
 * Local test keys only (local Supabase stack), outside the repo.
 */
const SECRETS_FILE = path.join(tmpdir(), "pumpdesk-e2e-totp.json");

export type StoredFactor = { factorId: string; secret: string };

export function readFactors(): Record<string, StoredFactor> {
  if (!existsSync(SECRETS_FILE)) return {};
  return JSON.parse(readFileSync(SECRETS_FILE, "utf8")) as Record<string, StoredFactor>;
}

export function writeFactors(factors: Record<string, StoredFactor>) {
  writeFileSync(SECRETS_FILE, JSON.stringify(factors, null, 2), { mode: 0o600 });
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of input.replace(/=+$/, "").toUpperCase()) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error("Bad base32 key");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = bits.match(/.{8}/g) ?? [];
  return Buffer.from(bytes.map((byte) => parseInt(byte, 2)));
}

/** The 6-digit code an authenticator app shows right now (RFC 6238, SHA-1, 30 s). */
export function totpCode(secret: string, now = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)));
  const hash = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hash[hash.length - 1] & 15;
  const value = (hash.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return value.toString().padStart(6, "0");
}

/** Every seeded user an e2e spec signs in as. */
export const E2E_USERS = [
  "dispatcher@midcoast.test",
  "owner@test-co.test",
  "readonly@midcoast.test",
  ...(process.env.E2E_EMAIL ? [process.env.E2E_EMAIL] : []),
];
