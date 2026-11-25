import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, localizePath } from "@/i18n/config";
import { cookieOptions, googleRedirectUri, OAUTH_COOKIE, safeNext, SESSION_COOKIE, signIn } from "@/lib/auth";

type Handshake = { state: string; nonce: string; verifier: string; next: string };

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

function readHandshake(value: string | undefined): Handshake | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<Handshake>;
    if (typeof parsed.state !== "string" || typeof parsed.nonce !== "string" || typeof parsed.verifier !== "string" || typeof parsed.next !== "string") return null;
    return parsed as Handshake;
  } catch {
    return null;
  }
}

/** Google sends the visitor back here: checks the handshake, swaps the code for an ID token and opens a session. */
export async function GET(request: NextRequest) {
  const handshake = readHandshake(request.cookies.get(OAUTH_COOKIE)?.value);
  const next = safeNext(handshake?.next, `/${defaultLocale}`);
  const lang = next.split("/")[1];
  const back = (path: string) => {
    const response = NextResponse.redirect(new URL(path, googleRedirectUri(request.nextUrl.origin)));
    // `__Host-` cookies are only replaced with the same attributes.
    response.cookies.set(OAUTH_COOKIE, "", cookieOptions(0));
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  // Any failure (cancelled, forged, expired) returns the visitor where they were, signed out.
  const failed = () => back(next);

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!handshake || !code || !state || !same(state, handshake.state) || !clientId || !clientSecret) return failed();

  let profile: { sub: string; email: string | null; name: string | null };
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: googleRedirectUri(request.nextUrl.origin),
        grant_type: "authorization_code",
        code_verifier: handshake.verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!tokenResponse.ok) return failed();
    const { id_token: idToken } = (await tokenResponse.json()) as { id_token?: string };
    if (typeof idToken !== "string") return failed();

    // The ID token comes straight from Google's token endpoint over TLS, so its claims can be read
    // without checking the signature (OpenID Connect Core 3.1.3.7); the claims are still validated.
    const claims = JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
    const valid =
      GOOGLE_ISSUERS.includes(String(claims.iss)) &&
      (claims.aud === clientId || (Array.isArray(claims.aud) && claims.aud.includes(clientId))) &&
      typeof claims.exp === "number" &&
      claims.exp * 1000 > Date.now() &&
      typeof claims.nonce === "string" &&
      same(claims.nonce, handshake.nonce) &&
      typeof claims.sub === "string" &&
      claims.sub.length > 0;
    if (!valid) return failed();
    profile = {
      sub: claims.sub as string,
      email: typeof claims.email === "string" && claims.email_verified === true ? claims.email : null,
      name: typeof claims.name === "string" ? claims.name.slice(0, 200) : null,
    };
  } catch {
    return failed();
  }

  try {
    const session = await signIn(profile);
    // A new crew member chooses a tag first, then carries on to where they were going.
    const target = session.needsTag ? `${localizePath("/account", hasLocale(lang) ? lang : defaultLocale)}?next=${encodeURIComponent(next)}` : next;
    const response = back(target);
    response.cookies.set(SESSION_COOKIE, session.token, cookieOptions(session.maxAge));
    return response;
  } catch {
    return failed();
  }
}
