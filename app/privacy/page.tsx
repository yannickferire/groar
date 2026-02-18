import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Groar - Learn how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <article className="max-w-2xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </header>

          <div className="space-y-8 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Introduction</h2>
              <p className="leading-relaxed">
                Welcome to Groar. We respect your privacy and are committed to
                protecting your personal data. This privacy policy explains how we
                collect, use, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Information We Collect</h2>

              <h3 className="text-lg font-medium mb-2 text-foreground/90">Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-2">
                <li>
                  <strong className="text-foreground">Account information:</strong> When you sign in
                  via X (Twitter) OAuth, we receive your public profile information
                  (name, handle, profile picture). We do not access your X password.
                </li>
                <li>
                  <strong className="text-foreground">Social media metrics:</strong> You may enter social media
                  metrics to create visual content. For free users, this information is processed
                  locally. For paid plan users, exported images and their associated metrics
                  are stored on our servers solely so you can access and reuse them later.
                </li>
              </ul>

              <h3 className="text-lg font-medium mb-2 text-foreground/90">Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong className="text-foreground">Usage data:</strong> We may collect anonymous usage
                  statistics to improve our service.
                </li>
                <li>
                  <strong className="text-foreground">Device information:</strong> Basic device and browser
                  information for compatibility purposes.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To send you marketing communications (with your consent)</li>
                <li>To analyze usage and improve our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Data Storage and Security</h2>
              <p className="leading-relaxed">
                Your visual creations are generated locally in your browser. For free
                users, images are not stored on our servers. For paid plan users,
                exported images are stored securely on our servers solely for you to
                access and reuse them — we do not use your images for any other
                purpose. Your account data is stored securely and will not be shared
                with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Third-Party Services</h2>
              <p className="mb-2">We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Authentication (X / Twitter OAuth)</li>
                <li>Payment processing (Polar)</li>
                <li>Analytics (privacy-focused)</li>
                <li>Hosting (Vercel)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Access your personal data</li>
                <li>Request deletion of your data</li>
                <li>Unsubscribe from marketing communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us
                at{" "}
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

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify
                you of any changes by posting the new Privacy Policy on this page and
                updating the &quot;Last updated&quot; date.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
