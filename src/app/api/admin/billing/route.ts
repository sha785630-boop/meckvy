import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import {
  approvePayment,
  getBankDetails,
  grantFreeDays,
  listPayments,
  rejectPayment,
  saveBankDetails,
  type BankDetails,
} from "@/lib/billing";
import { notifyOwner } from "@/lib/owner-push";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  return NextResponse.json({ payments: await listPayments(), bank: await getBankDetails() });
}

type Action =
  | { action: "approve"; id: string }
  | { action: "reject"; id: string; note?: string }
  | { action: "bank"; bank: Partial<BankDetails> }
  | { action: "extend"; guesthouseId: string; days: number };

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Action | null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  switch (body?.action) {
    case "approve": {
      const done = await approvePayment(body.id);
      if (!done) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      await notifyOwner(done.guesthouseId, {
        title: "✅ Payment received — thank you!",
        body: `Your DirectStay plan is active until ${fmt(done.paidUntil)}.`,
        url: "/dashboard/billing",
      });
      return NextResponse.json({ ok: true });
    }
    case "reject": {
      const done = await rejectPayment(body.id, body.note ?? "");
      if (!done) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      await notifyOwner(done.guesthouseId, {
        title: "⚠️ We couldn’t confirm your payment",
        body: body.note?.trim() || "Open Plan & billing to see why and send a new slip.",
        url: "/dashboard/billing",
      });
      return NextResponse.json({ ok: true });
    }
    case "bank":
      return NextResponse.json({ ok: true, bank: await saveBankDetails(body.bank ?? {}) });
    case "extend": {
      const days = Math.round(Number(body.days));
      if (!(days > 0 && days <= 366)) {
        return NextResponse.json({ error: "Invalid days" }, { status: 400 });
      }
      const done = await grantFreeDays(body.guesthouseId, days);
      if (!done) return NextResponse.json({ error: "Guesthouse not found" }, { status: 404 });
      await notifyOwner(body.guesthouseId, {
        title: "🎁 You got free DirectStay time",
        body: `${days} free days were added to your account.`,
        url: "/dashboard/billing",
      });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
