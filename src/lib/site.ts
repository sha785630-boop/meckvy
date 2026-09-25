export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://meckvy-bqug.vercel.app"
).replace(/\/$/, "");

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";

export const CONTACT_PHONE = "+960 760 6977";
