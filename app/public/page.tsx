import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Testimonials from "@/components/Testimonials";
import VsFaq from "@/components/VsFaq";
import { faqs } from "@/lib/faqs";
import { FadeInView } from "@/components/ui/motion";
import VsCta from "@/components/VsCta";
import PublicLeaderboardClient from "./client";
import { ADMIN_USER_ID } from "@/lib/api-auth";
import { pool } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See who's leading the GROAR community leaderboard. Export visuals, log in daily, and climb the ranks.",
  alternates: { canonical: "/public" },
  openGraph: {
    title: "Leaderboard — GROAR",
    description: "See who's leading the GROAR community leaderboard. Export visuals, log in daily, and climb the ranks.",
    url: `${siteUrl}/public`,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Leaderboard", item: `${siteUrl}/public` },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

async function getLeaderboard() {
  try {
    const result = await pool.query(
      `SELECT
        u.name,
        u.image,
        u."xUsername",
        s."exportsCount",
        s."currentStreak",
        COALESCE(dp.score, 0) AS "score",
        CASE WHEN GREATEST(s."lastLoginDate", s."lastExportDate") = CURRENT_DATE THEN s."pointsToday" ELSE 0 END AS "pointsToday",
        tmrr."startupName",
        tmrr.website AS "startupWebsite"
      FROM "user" u
      INNER JOIN user_stats s ON s."userId" = u.id
      LEFT JOIN LATERAL (
        SELECT SUM(points) AS score FROM daily_points
        WHERE "userId" = u.id AND date > CURRENT_DATE - 30
      ) dp ON true
      LEFT JOIN LATERAL (
        SELECT "startupName", website FROM trustmrr_snapshot
        WHERE "userId" = u.id AND "startupName" IS NOT NULL
        ORDER BY date DESC, "createdAt" DESC LIMIT 1
      ) tmrr ON true
      WHERE COALESCE(dp.score, 0) > 0 AND u.id != $1
      ORDER BY dp.score DESC, s."updatedAt" ASC
      LIMIT 10`,
      [ADMIN_USER_ID]
    );
    return result.rows;
  } catch (error) {
    console.error("Public leaderboard SSR error:", error);
    return [];
  }
}

export const revalidate = 300; // revalidate every 5 minutes

export default async function PublicLeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main className="flex-1 flex flex-col items-center py-8 md:py-16 mt-4 gap-24">
        <FadeInView direction="up" distance={32}>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4">
              Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance">
              Top 10 of the 🐯 GROAR community. Export visuals, log in daily, and climb the ranks.
            </p>
          </div>
        </FadeInView>

        <div className="w-full max-w-5xl -mt-6">
          <PublicLeaderboardClient initialLeaderboard={leaderboard} />
        </div>

        <div className="w-full max-w-3xl">
          <VsCta title="Want to join the leaderboard?" />
        </div>

        <div className="w-full">
          <Testimonials />
        </div>

        <section className="w-full max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
          <VsFaq faqs={faqs} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
