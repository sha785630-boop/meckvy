import { NextResponse } from "next/server";
import {
  createSessionToken,
  registerAccount,
  setSessionCookie,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      guesthouseName?: string;
      island?: string;
      plan?: string;
    };

    if (
      !body.email?.trim() ||
      !body.password ||
      !body.name?.trim() ||
      !body.guesthouseName?.trim() ||
      !body.island?.trim()
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const session = await registerAccount({
      email: body.email,
      password: body.password,
      name: body.name,
      guesthouseName: body.guesthouseName,
      island: body.island,
      plan: body.plan,
    });

    const token = await createSessionToken(session);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, session });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 400 },
    );
  }
}
