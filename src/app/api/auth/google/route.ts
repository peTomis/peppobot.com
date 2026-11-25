import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { cookieOptions, googleRedirectUri, OAUTH_COOKIE, randomToken, safeNext } from "@/lib/auth";

/**
 * Starts "Sign in with Google" (OpenID Connect, authorization code flow with PKCE).
 * `?next=/en/library/…` is where the visitor lands afterwards; only paths on this site are accepted.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.json({ error: "Sign-in is not configured." }, { status: 503 });
  }

  const next = safeNext(request.nextUrl.searchParams.get("next"), `/${defaultLocale}`);
  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(request.nextUrl.origin),
    response_type: "code",
    // Only the account id and, for moderation, the email and name: never shown on the site.
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(url);
  // The handshake lives 10 minutes in an httpOnly cookie, checked by the callback.
  response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, nonce, verifier, next }), cookieOptions(600));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
