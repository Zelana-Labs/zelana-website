"use client";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";

export default function TermsPage() {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Please read these terms carefully before using Zelana&apos;s services.
            </p>
            <p className="text-sm text-zinc-400 mt-6">Last updated: February 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="space-y-12">
            <Section number={1} title="Acceptance of Terms">
              <p>
                By accessing or using Zelana&apos;s services, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our services.
              </p>
            </Section>

            <Section number={2} title="Description of Services">
              <p>
                Zelana provides cross-chain stablecoin payment infrastructure. Our services include but are not
                limited to payment processing, transaction management, and related blockchain services.
              </p>
            </Section>

            <Section number={3} title="Eligibility">
              <p>
                You must be at least 18 years old and capable of forming a binding contract to use our services.
                By using our services, you represent that you meet these requirements and that you are not
                prohibited from using our services under any applicable laws.
              </p>
            </Section>

            <Section number={4} title="User Responsibilities">
              <p className="mb-5">You are responsible for:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Item>Securing your wallet and private keys</Item>
                <Item>All activities under your account</Item>
                <Item>Complying with applicable laws</Item>
                <Item>Providing accurate information</Item>
                <Item>Understanding blockchain risks</Item>
              </div>
            </Section>

            <Section number={5} title="Prohibited Activities">
              <p className="mb-5">You agree not to:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Item type="prohibited">Use services for illegal purposes</Item>
                <Item type="prohibited">Interfere with our services</Item>
                <Item type="prohibited">Harm other users</Item>
                <Item type="prohibited">Money laundering activities</Item>
                <Item type="prohibited">Circumvent security measures</Item>
                <Item type="prohibited">Reverse engineer our code</Item>
              </div>
            </Section>

            <Section number={6} title="Fees and Payments">
              <p>
                Certain services may be subject to fees. All fees will be disclosed before you complete a transaction.
                You are responsible for any network fees (gas fees) associated with blockchain transactions.
              </p>
            </Section>

            <Section number={7} title="Intellectual Property">
              <p>
                All content, features, and functionality of our services are owned by Zelana Labs and are protected
                by copyright, trademark, and other intellectual property laws. You may not copy, modify, or
                distribute our content without prior written consent.
              </p>
            </Section>

            <Section number={8} title="Disclaimer of Warranties">
              <p>
                Our services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
                either express or implied. We do not guarantee that our services will be uninterrupted, secure,
                or error-free. You use our services at your own risk.
              </p>
            </Section>

            <Section number={9} title="Limitation of Liability">
              <p>
                To the fullest extent permitted by law, Zelana Labs shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising out of or related to your use of our services,
                including but not limited to loss of funds, data, or profits.
              </p>
            </Section>

            <Section number={10} title="Indemnification">
              <p>
                You agree to indemnify and hold harmless Zelana Labs and its affiliates, officers, directors,
                employees, and agents from any claims, damages, losses, or expenses arising from your use of
                our services or violation of these terms.
              </p>
            </Section>

            <Section number={11} title="Termination">
              <p>
                We reserve the right to suspend or terminate your access to our services at any time, with or
                without cause, and with or without notice. Upon termination, your right to use our services
                will immediately cease.
              </p>
            </Section>

            <Section number={12} title="Changes to Terms">
              <p>
                We reserve the right to modify these terms at any time. We will provide notice of significant
                changes by posting the updated terms on our website. Your continued use of our services after
                such changes constitutes acceptance of the new terms.
              </p>
            </Section>

            <Section number={13} title="Governing Law">
              <p>
                These terms shall be governed by and construed in accordance with applicable laws, without
                regard to conflict of law principles.
              </p>
            </Section>

            <Section number={14} title="Contact Us">
              <p>
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@zelana.io" className="text-zinc-900 font-medium hover:underline">
                  legal@zelana.io
                </a>
              </p>
            </Section>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 pt-10 border-t border-zinc-200 text-center">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Have questions?</h3>
            <p className="text-zinc-500 mb-6">We&apos;re here to help clarify any terms.</p>
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

function Item({ children, type = "allowed" }: { children: React.ReactNode; type?: "allowed" | "prohibited" }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-50">
      {type === "allowed" ? (
        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
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
