import { appIcon } from "@/lib/app-icon";

const SIZES = new Set([96, 180, 192, 512]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await context.params;
  return appIcon(SIZES.has(Number(raw)) ? Number(raw) : 192);
}
