// TrustMRR API helper
// Server-only - do not import in client components

export type TrustMRRStartup = {
  slug: string;
  name: string;
  xHandle: string;
  revenue: {
    mrrCents: number;
    last30DaysCents: number;
    totalCents: number;
  };
  customers: number;
  activeSubscriptions: number;
  growth30d: number; // percentage
};

export type TrustMRRResult =
  | { startup: TrustMRRStartup }
  | { notFound: true }
  | { error: string };

export async function fetchStartupByXHandle(
  xHandle: string
): Promise<TrustMRRResult> {
  const apiKey = process.env.TRUSTMRR_API_KEY;
  if (!apiKey) {
    return { error: "TRUSTMRR_API_KEY is not configured" };
  }

  // Strip @ prefix if present
  const handle = xHandle.replace(/^@/, "");

  try {
    const res = await fetch(
      `https://trustmrr.com/api/v1/startups?xHandle=${encodeURIComponent(handle)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (res.status === 404) {
      return { notFound: true };
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("TrustMRR API error:", res.status, text);
      return { error: `API error: ${res.status}` };
    }

    const data = await res.json();

    // The API returns an array of startups matching the xHandle
    const startups = Array.isArray(data) ? data : data.data ?? data.startups ?? [data];

    if (startups.length === 0) {
      return { notFound: true };
    }

    const s = startups[0];
    const revenue = s.revenue ?? {};

    // API returns dollars — convert to cents for consistent DB storage
    return {
      startup: {
        slug: s.slug ?? "",
        name: s.name ?? "",
        xHandle: s.xHandle ?? handle,
        revenue: {
          mrrCents: Math.round((revenue.mrr ?? 0) * 100),
          last30DaysCents: Math.round((revenue.last30Days ?? 0) * 100),
          totalCents: Math.round((revenue.total ?? 0) * 100),
        },
        customers: s.customers ?? 0,
        activeSubscriptions: s.activeSubscriptions ?? 0,
        growth30d: s.growth30d ?? 0,
      },
    };
  } catch (err) {
    console.error("TrustMRR fetch error:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
