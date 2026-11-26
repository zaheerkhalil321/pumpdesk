import { execFileSync } from "node:child_process";

import { E2E_USERS, readFactors, totpCode, writeFactors } from "./support/two-step";

type Factor = { id: string; factor_type: string; status: string };

/** URL and keys of the LOCAL Supabase stack (`supabase start`), never the hosted project. */
function localStack() {
  const out = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const env = Object.fromEntries(
    out
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=").replace(/^"|"$/g, "")];
      }),
  );
  if (!env.API_URL || !env.ANON_KEY || !env.SERVICE_ROLE_KEY) throw new Error("Start the local stack: supabase start");
  return { url: `${env.API_URL}/auth/v1`, anonKey: env.ANON_KEY, serviceKey: env.SERVICE_ROLE_KEY };
}

/**
 * Gives every e2e user one verified authenticator app (TOTP) and saves its key, so specs can
 * pass the code step. A user whose saved key still matches its factor is left as it is.
 */
export default async function globalSetup() {
  const password = process.env.E2E_PASSWORD;
  if (!password) return; // login() explains what is missing.
  const stack = localStack();

  const call = async <T>(method: string, route: string, token: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${stack.url}${route}`, {
      method,
      headers: { apikey: stack.anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`${method} ${route} failed: ${response.status}`);
    return (await response.json().catch(() => ({}))) as T;
  };

  const saved = readFactors();
  for (const email of E2E_USERS) {
    const session = await call<{ access_token: string; user: { id: string } }>(
      "POST",
      "/token?grant_type=password",
      stack.anonKey,
      { email, password },
    );
    const user = await call<{ factors?: Factor[] }>("GET", "/user", session.access_token);
    const factors = user.factors ?? [];
    if (factors.some((f) => f.id === saved[email]?.factorId && f.status === "verified")) continue;

    for (const factor of factors) {
      await call("DELETE", `/admin/users/${session.user.id}/factors/${factor.id}`, stack.serviceKey);
    }
    const enrolled = await call<{ id: string; totp: { secret: string } }>("POST", "/factors", session.access_token, {
      factor_type: "totp",
      friendly_name: "e2e",
    });
    const challenge = await call<{ id: string }>("POST", `/factors/${enrolled.id}/challenge`, session.access_token, {});
    await call("POST", `/factors/${enrolled.id}/verify`, session.access_token, {
      challenge_id: challenge.id,
      code: totpCode(enrolled.totp.secret),
    });
    saved[email] = { factorId: enrolled.id, secret: enrolled.totp.secret };
  }
  writeFactors(saved);
}
