import { NextResponse } from "next/server";

// Lightweight HTML page with only meta tags for social media crawlers
// The full homepage is too large (~8MB) for Twitter's card fetcher
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Groar — Turn your growth into visuals that Roaaar</title>
  <meta name="description" content="Your analytics deserve better than a screenshot. Get eye-catching visuals in 10 seconds. Built for builders, founders and indie hackers." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://groar.app" />
  <meta property="og:site_name" content="Groar" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="Groar — Turn your growth into visuals that Roaaar" />
  <meta property="og:description" content="Your analytics deserve better than a screenshot. Get eye-catching visuals in 10 seconds. Built for builders, founders and indie hackers." />
  <meta property="og:image" content="https://groar.app/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Groar — Share your growth with stunning visuals" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:creator" content="@yannick_ferire" />
  <meta name="twitter:title" content="Groar — Turn your growth into visuals that Roaaar" />
  <meta name="twitter:description" content="Your analytics deserve better than a screenshot. Get eye-catching visuals in 10 seconds. Built for builders, founders and indie hackers." />
  <meta name="twitter:image" content="https://groar.app/og.png" />
</head>
<body>
  <h1>Groar — Turn your growth into visuals that Roaaar</h1>
  <p>Your analytics deserve better than a screenshot. Get eye-catching visuals in 10 seconds.</p>
  <a href="https://groar.app">Visit Groar</a>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
