// TrustMRR API helper
// Server-only - do not import in client components

export type TrustMRRStartup = {
  slug: string;
  name: string;
  xHandle: string;
  website: string | null;
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
  | { startup: TrustMRRStartup; startups: TrustMRRStartup[] }
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

    // Parse all startups
    const parsed: TrustMRRStartup[] = startups.map((s: Record<string, unknown>) => {
      const revenue = (s.revenue ?? {}) as Record<string, number>;
      return {
        slug: (s.slug as string) ?? "",
        name: (s.name as string) ?? "",
        xHandle: (s.xHandle as string) ?? handle,
        website: (s.website as string) ?? null,
        revenue: {
          mrrCents: Math.round((revenue.mrr ?? 0) * 100),
          last30DaysCents: Math.round((revenue.last30Days ?? 0) * 100),
          totalCents: Math.round((revenue.total ?? 0) * 100),
        },
        customers: (s.customers as number) ?? 0,
        activeSubscriptions: (s.activeSubscriptions as number) ?? 0,
        growth30d: (s.growth30d as number) ?? 0,
      };
    });

    // Aggregate all startups into a combined view
    const aggregated: TrustMRRStartup = {
      slug: parsed.map((s) => s.slug).filter(Boolean).join(","),
      name: parsed.map((s) => s.name).filter(Boolean).join(", "),
      xHandle: handle,
      website: parsed.map((s) => s.website).filter(Boolean).join(", "),
      revenue: {
        mrrCents: parsed.reduce((sum, s) => sum + s.revenue.mrrCents, 0),
        last30DaysCents: parsed.reduce((sum, s) => sum + s.revenue.last30DaysCents, 0),
        totalCents: parsed.reduce((sum, s) => sum + s.revenue.totalCents, 0),
      },
      customers: parsed.reduce((sum, s) => sum + s.customers, 0),
      activeSubscriptions: parsed.reduce((sum, s) => sum + s.activeSubscriptions, 0),
      growth30d: parsed.length === 1
        ? parsed[0].growth30d
        : parsed.reduce((sum, s) => sum + s.growth30d, 0) / parsed.length,
    };

    return { startup: aggregated, startups: parsed };
  } catch (err) {
    console.error("TrustMRR fetch error:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
