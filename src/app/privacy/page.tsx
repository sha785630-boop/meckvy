import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Meckvy",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="25 September 2026">
      <p>
        Meckvy is software that helps guesthouses in the Maldives receive and
        answer guest enquiries. This page explains what data we handle and why.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Guesthouse accounts:</strong> name, island, email, password
          (stored as a secure hash), and plan / billing status.
        </li>
        <li>
          <strong>Guest enquiries:</strong> when a guest uses a guesthouse’s
          website widget, we store their name, email, optional phone, stay
          dates, and message so the guesthouse can reply.
        </li>
        <li>
          <strong>Signup requests:</strong> details you submit on our pricing
          page so we can contact you.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To deliver enquiries to the right guesthouse inbox.</li>
        <li>To send replies and translations the guesthouse asks us to send.</li>
        <li>To run accounts, billing, and support.</li>
      </ul>
      <p>We do not sell personal data or use guest messages for advertising.</p>

      <h2>Services we rely on</h2>
      <ul>
        <li>Vercel (hosting) and Turso (database).</li>
        <li>Stripe (card payments — we never see full card numbers).</li>
        <li>Resend (email delivery) and translation providers for message text.</li>
        <li>Meta WhatsApp Cloud API, only if a guesthouse connects it.</li>
      </ul>

      <h2>Who owns guest data</h2>
      <p>
        Each guesthouse controls the enquiries sent to it. Meckvy processes that
        data on the guesthouse’s behalf. Guests who want their data removed can
        ask the guesthouse or contact us directly.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We keep data while an account is active. When a guesthouse closes its
        account, we delete its inbox data within 30 days unless the law requires
        us to keep it longer.
      </p>

      <h2>Security</h2>
      <p>
        Data is sent over HTTPS, passwords are hashed, and each guesthouse can
        only see its own inbox.
      </p>
    </LegalPage>
  );
}
