/** Meckvy = company. DirectStay = this guesthouse product. */
export const COMPANY = "Meckvy";
export const PRODUCT = "DirectStay";
export const PRODUCT_TAGLINE = "Guest inbox & booking page for Maldivian guesthouses";

export const BRAND = {
  company: COMPANY,
  product: PRODUCT,
  /** e.g. "DirectStay by Meckvy" */
  productByCompany: `${PRODUCT} by ${COMPANY}`,
  /** Browser tab / share title */
  title: `${PRODUCT} — ${COMPANY}`,
  description:
    "Guest messages from your website land in one inbox. Reply in English — DirectStay sends it in their language.",
} as const;
