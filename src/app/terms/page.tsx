import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Meckvy",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="25 September 2026">
      <p>
        These terms apply when you create a Meckvy account or subscribe to a
        paid plan. By using Meckvy you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        Meckvy provides a website enquiry widget, a shared inbox, reply
        templates, translation, and automations for guesthouses. Features may
        improve or change over time.
      </p>

      <h2>Plans and billing</h2>
      <ul>
        <li>Starter is USD 29 / month and Pro is USD 59 / month.</li>
        <li>Subscriptions renew monthly and are charged through Stripe.</li>
        <li>
          You can cancel anytime; access continues until the end of the paid
          month. We don’t refund partial months.
        </li>
      </ul>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Keep your login private and your account details accurate.</li>
        <li>Only message guests who contacted you or agreed to hear from you.</li>
        <li>Don’t use Meckvy for spam, fraud, or anything illegal.</li>
      </ul>

      <h2>Translations</h2>
      <p>
        Automatic translation is a convenience and can contain mistakes. Check
        important details (prices, dates, transfer times) before sending.
      </p>

      <h2>Availability</h2>
      <p>
        We work to keep Meckvy running but can’t guarantee it will always be
        available or error-free. We aren’t liable for lost bookings or indirect
        losses, and our total liability is limited to what you paid us in the
        previous three months.
      </p>

      <h2>Ending the service</h2>
      <p>
        You can close your account at any time. We may suspend accounts that
        break these terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the Republic of Maldives.</p>
    </LegalPage>
  );
}
