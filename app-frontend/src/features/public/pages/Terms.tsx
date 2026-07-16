import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";


export function TermsPage() {
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
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Terms of Service
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: June 17, 2026
          </p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                1. Agreement to Terms
              </h2>
              <p className="mt-3">
                These Terms of Service constitute a legally binding agreement made between you (“user”, “you”, or “your”) and 42 Prediction (“we”, “us”, or “our”), concerning your access to and use of the 42 Prediction prediction market platform. By accessing or using the platform, you agree that you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these terms, then you are expressly prohibited from using the platform and you must discontinue use immediately.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                2. Eligibility
              </h2>
              <p className="mt-3">
                You must be at least 18 years old and capable of entering into a legally binding contract to use the platform. By using the platform, you represent and warrant that you meet all of the foregoing eligibility requirements. If you do not meet all of these requirements, you must not access or use the platform.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                3. Description of Services
              </h2>
              <p className="mt-3">
                42 Prediction provides a decentralized prediction market platform where users can create, trade, and settle prediction markets related to educational outcomes, examinations, and related events. The platform operates on blockchain technology and uses smart contracts to facilitate market creation and settlement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                4. User Accounts
              </h2>
              <p className="mt-3">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account. You are responsible for safeguarding the password and any other credentials that you use to access the platform and for any activities or actions under your account.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                5. Prohibited Activities
              </h2>
              <p className="mt-3">
                You may not access or use the platform for any purpose other than that for which we make the platform available. The platform may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us. Prohibited activities include, but are not limited to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Systematically retrieving data or other content from the platform to create or compile a collection, database, or directory without written permission from us.</li>
                <li>Making any unauthorized use of the platform, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email.</li>
                <li>Engaging in unauthorized framing of or linking to the platform.</li>
                <li>Tricking, defrauding, or misleading us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                <li>Attempting to impersonate another user or person.</li>
                <li>Using any information obtained from the platform in order to harass, abuse, or harm another person.</li>
                <li>Using the platform in a manner inconsistent with any applicable laws or regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                6. Market Creation and Trading
              </h2>
              <p className="mt-3">
                By creating or participating in a market, you acknowledge that prediction markets involve financial risk. All trades are final once executed on the blockchain. 42 Prediction does not guarantee the accuracy of market outcomes or the resolution of disputes. Markets are settled according to the rules defined at market creation and community consensus where applicable.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                7. Intellectual Property Rights
              </h2>
              <p className="mt-3">
                Unless otherwise indicated, the platform is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the platform (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                8. Limitation of Liability
              </h2>
              <p className="mt-3">
                In no event shall we, our directors, employees, or agents be liable to you for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses, resulting from: (i) your access to or use of or inability to access or use the platform; (ii) any conduct or content of any third party on the platform; (iii) any content obtained from the platform; or (iv) unauthorized access, use, or alteration of your transmissions or content.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                9. Governing Law
              </h2>
              <p className="mt-3">
                These Terms shall be governed by and defined following the laws of the jurisdiction in which 42 Prediction is established. 42 Prediction and yourself irrevocably consent that the courts of such jurisdiction shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                10. Changes to Terms
              </h2>
              <p className="mt-3">
                We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Service at any time and for any reason. We will alert you about any changes by updating the “Last updated” date of these Terms of Service. It is your responsibility to periodically review these Terms of Service to stay informed of updates.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                11. Contact Us
              </h2>
              <p className="mt-3">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-2 text-foreground">
                Email: legal@42prediction.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
