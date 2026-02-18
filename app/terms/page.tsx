import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Groar - Rules and guidelines for using our service.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <article className="max-w-2xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </header>

          <div className="space-y-8 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Groar, you accept and agree to be bound by
                these Terms of Service. If you do not agree to these terms, please do
                not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Description of Service</h2>
              <p className="leading-relaxed mb-3">
                Groar is a web application that allows users to create shareable
                visual content from social media metrics. The service is provided
                &quot;as is&quot; and may be updated or modified at any time.
              </p>
              <p className="leading-relaxed">
                Groar offers a free tier with limited features and paid plans
                (Pro and Agency) with additional capabilities such as premium
                templates, custom branding, and more backgrounds. Paid
                subscriptions are billed monthly or annually through our payment
                provider, Polar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. User Responsibilities</h2>
              <p className="mb-2">When using Groar, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Provide accurate information</li>
                <li>Use the service for lawful purposes only</li>
                <li>Not misrepresent your social media metrics or identity</li>
                <li>Not use the service to create misleading or fraudulent content</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Intellectual Property</h2>
              <p className="leading-relaxed">
                The Groar name, logo, and all related graphics are trademarks of
                Groar. You retain ownership of any content you create using our
                service. By using Groar, you grant us permission to display your
                created content for promotional purposes with attribution.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. User Content</h2>
              <p className="mb-2">
                You are solely responsible for the content you create and share using
                Groar. For paid plan users, exported images are stored on our servers
                solely so you can access and reuse them later. We do not use your
                images for any other purpose. You agree not to create content that is:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Illegal or promotes illegal activities</li>
                <li>Defamatory, harassing, or threatening</li>
                <li>Misleading or fraudulent</li>
                <li>Infringing on others&apos; rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                Groar is provided &quot;as is&quot; without warranties of any kind.
                We do not guarantee that the service will be uninterrupted, secure, or
                error-free. We are not responsible for any damages resulting from your
                use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, Groar and its creators shall
                not be liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use
                of the service after changes constitutes acceptance of the new terms.
                We will make reasonable efforts to notify users of significant
                changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Termination</h2>
              <p className="leading-relaxed">
                We reserve the right to terminate or suspend access to our service at
                any time, without prior notice, for conduct that we believe violates
                these Terms of Service or is harmful to other users or the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">10. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms of Service shall be governed by and construed in
                accordance with applicable laws, without regard to conflict of law
                principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">11. Contact</h2>
              <p className="leading-relaxed">
                For questions about these Terms of Service, please contact us at{" "}
                <a
                  href="https://x.com/yannick_ferire"
                  target="_blank"
                  rel="noopener"
                  className="text-primary hover:underline"
                >
                  @yannick_ferire on X
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
