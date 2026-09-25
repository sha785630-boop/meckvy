import { getSession } from "@/lib/auth";

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || "sha785630@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

export async function getAdminSession() {
  const session = await getSession();
  return session && isAdminEmail(session.email) ? session : null;
}
