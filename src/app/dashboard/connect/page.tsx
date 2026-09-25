import { ConnectWebsite } from "@/components/ConnectWebsite";
import { getSession } from "@/lib/auth";

export default async function ConnectPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Connect your website
        </h1>
        <p className="mt-1 text-ink-soft">
          Start getting guest messages in minutes — no developer needed.
        </p>
      </header>
      <ConnectWebsite
        guesthouseId={session.guesthouseId}
        guesthouseName={session.guesthouseName}
      />
    </div>
  );
}
