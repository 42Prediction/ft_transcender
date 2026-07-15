import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";


export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Privacy Policy
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: June 17, 2026
          </p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                1. Introduction
              </h2>
              <p className="mt-3">
                42 Prediction (“we”, “our”, or “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our prediction market platform. Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the platform.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                2. Information We Collect
              </h2>
              <p className="mt-3">
                We may collect information about you in a variety of ways. The information we may collect via the platform includes:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">Personal Data:</strong> name, email address, wallet address, and any other information you voluntarily provide when registering, filling out forms, or interacting with the platform.
                </li>
                <li>
                  <strong className="text-foreground">Derivative Data:</strong> information our servers automatically collect when you access the platform, such as your IP address, browser type, operating system, access times, and the pages you view.
                </li>
                <li>
                  <strong className="text-foreground">Financial Data:</strong> wallet transaction data and market participation history required to operate the prediction markets.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                3. Use of Your Information
              </h2>
              <p className="mt-3">
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the platform to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Create and manage your account.</li>
                <li>Process transactions and manage market positions.</li>
                <li>Send you administrative information, such as updates to terms, conditions, and policies.</li>
                <li>Respond to your inquiries and offer customer support.</li>
                <li>Improve the platform and user experience.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                4. Disclosure of Your Information
              </h2>
              <p className="mt-3">
                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.
                </li>
                <li>
                  <strong className="text-foreground">Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
                </li>
                <li>
                  <strong className="text-foreground">Blockchain Data:</strong> Transactions on the blockchain are public by design. Your wallet address and transaction history may be visible to anyone.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                5. Security of Your Information
              </h2>
              <p className="mt-3">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                6. Cookies and Tracking Technologies
              </h2>
              <p className="mt-3">
                We may use cookies, web beacons, tracking pixels, and other tracking technologies on the platform to help customize the platform and improve your experience. When you access the platform, your personal information is not collected through the use of tracking technology. Most browsers are set to accept cookies by default. You can remove or reject cookies, but be aware that such action could affect the availability and functionality of the platform.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                7. Third-Party Websites
              </h2>
              <p className="mt-3">
                The platform may contain links to third-party websites and applications of interest, including advertisements and external services, that are not affiliated with us. Once you have used these links to leave the platform, any information you provide to these third parties is not covered by this Privacy Policy, and we cannot guarantee the safety and privacy of your information. Before visiting and providing any information to any third-party websites, you should inform yourself of the privacy policies and practices of the third party responsible for that website.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                8. Your Rights
              </h2>
              <p className="mt-3">
                Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete the personal information we have about you. To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                9. Contact Us
              </h2>
              <p className="mt-3">
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2 text-foreground">
                Email: geral@42prediction.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
