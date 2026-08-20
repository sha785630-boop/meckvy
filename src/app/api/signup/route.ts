import { NextResponse } from "next/server";
import { createSignupLead, type PlanId } from "@/lib/leads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      guesthouseName?: string;
      island?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      plan?: PlanId;
      notes?: string;
    };

    const required = [
      body.guesthouseName,
      body.island,
      body.contactName,
      body.email,
      body.phone,
      body.plan,
    ];

    if (required.some((v) => !v?.trim())) {
      return NextResponse.json(
        { error: "All fields except notes are required" },
        { status: 400 },
      );
    }

    if (body.plan !== "starter" && body.plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!body.email!.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const lead = await createSignupLead({
      guesthouseName: body.guesthouseName!,
      island: body.island!,
      contactName: body.contactName!,
      email: body.email!,
      phone: body.phone!,
      plan: body.plan,
      notes: body.notes,
    });

    return NextResponse.json({
      ok: true,
      id: lead.id,
      message:
        "Thanks — we saved your signup. We’ll contact you to set up the website widget and start your trial.",
    });
  } catch {
    return NextResponse.json({ error: "Could not save signup" }, { status: 500 });
  }
}
