import Link from "next/link";
import { LinkShieldHeader } from "@/components/LinkShieldChrome";
import ShieldProtect from "@/components/ShieldProtect";

export default function LinkShieldProtectPage() {
  return (
    <main>
      <LinkShieldHeader
        subtitle="Automatic scam link alerts"
        right={
          <Link href="/linkshield" className="text-sm text-zinc-400 hover:text-white">
            Manual scan →
          </Link>
        }
      />
      <div className="px-6 py-10 md:px-10">
        <ShieldProtect />
      </div>
    </main>
  );
}
