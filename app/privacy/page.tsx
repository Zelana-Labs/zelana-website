"use client";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <GradientBG />
      <Navbar />
      <main className="relative z-10">
        {/* Hero */}
        <div className="border-b border-zinc-100">
          <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-sm mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              We care about your privacy. Learn how Zelana collects, uses, and protects your information.
            </p>
            <p className="text-sm text-zinc-400 mt-6">Last updated: February 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="space-y-12">
            <Section number={1} title="Introduction">
              <p>
                Zelana Labs (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, and safeguard your information when you use our services.
              </p>
            </Section>

            <Section number={2} title="Information We Collect">
              <p className="mb-5">We may collect information that you provide directly to us, including:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Item>Wallet addresses and transaction data</Item>
                <Item>Usage data and analytics</Item>
                <Item>Communications you send to us</Item>
                <Item>Device and browser information</Item>
              </div>
            </Section>

            <Section number={3} title="How We Use Your Information">
              <p className="mb-5">We use the information we collect to:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Item>Provide and maintain our services</Item>
                <Item>Process transactions</Item>
                <Item>Improve and optimize our platform</Item>
                <Item>Communicate about updates</Item>
                <Item>Detect and prevent fraud</Item>
              </div>
            </Section>

            <Section number={4} title="Data Security">
              <p>
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
                over the Internet is 100% secure.
              </p>
            </Section>

            <Section number={5} title="Blockchain Data">
              <p>
                Please note that blockchain transactions are public by nature. Any information you submit to a
                blockchain network may be publicly accessible and cannot be deleted or modified.
              </p>
            </Section>

            <Section number={6} title="Third-Party Services">
              <p>
                Our services may contain links to third-party websites or integrate with third-party services.
                We are not responsible for the privacy practices of these third parties. We encourage you to
                review their privacy policies.
              </p>
            </Section>

            <Section number={7} title="Cookies and Tracking">
              <p>
                We may use cookies and similar tracking technologies to collect usage information and improve
                our services. You can control cookies through your browser settings.
              </p>
            </Section>

            <Section number={8} title="Your Rights">
              <p className="mb-5">Depending on your location, you may have the right to:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Item>Access your personal information</Item>
                <Item>Request correction of data</Item>
                <Item>Request deletion of your data</Item>
                <Item>Object to processing activities</Item>
              </div>
            </Section>

            <Section number={9} title="Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by
                posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </Section>

            <Section number={10} title="Contact Us">
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@zelana.io" className="text-zinc-900 font-medium hover:underline">
                  privacy@zelana.io
                </a>
              </p>
            </Section>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 pt-10 border-t border-zinc-200 text-center">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Have questions?</h3>
            <p className="text-zinc-500 mb-6">We&apos;re here to help with any privacy concerns.</p>
            <Link
              href="https://form.typeform.com/to/akKCUvuh"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Contact Us
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="pb-12 border-b border-zinc-100 last:border-0">
      <h2 className="text-xl font-semibold text-zinc-900 mb-4">
        <span className="text-zinc-400 mr-2">{number}.</span>
        {title}
      </h2>
      <div className="text-zinc-600 leading-relaxed">{children}</div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-50">
      <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm text-zinc-700">{children}</span>
    </div>
  );
}

function GradientBG() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 bg-gradient-to-b from-white via-zinc-50/50 to-white">
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] opacity-30 blur-[120px] bg-gradient-to-br from-zinc-200 via-zinc-100 to-transparent" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] opacity-20 blur-[100px] bg-gradient-to-tl from-zinc-300 via-zinc-200 to-transparent" />
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
    </div>
  );
}
