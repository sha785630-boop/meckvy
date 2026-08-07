import { NextResponse } from "next/server";
import {
  createSessionToken,
  loginAccount,
  setSessionCookie,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email?.trim() || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const session = await loginAccount(body.email, body.password);
    const token = await createSessionToken(session);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, session });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 401 },
    );
  }
}
