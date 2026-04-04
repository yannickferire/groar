import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const BOT_UA = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Serve lightweight meta-only page to social media bots (they only need OG tags, not the full app)
  if (pathname === "/" && BOT_UA.test(request.headers.get("user-agent") || "")) {
    return NextResponse.rewrite(new URL("/api/og-meta", request.url));
  }

  // Dashboard auth guard
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
