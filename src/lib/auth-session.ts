import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "meckvy_session";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  guesthouseId: string;
  guesthouseName: string;
  island: string;
  plan: string;
};

export function getAuthSecret() {
  const secret =
    process.env.AUTH_SECRET || "meckvy-dev-secret-change-me-in-production";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.guesthouseId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: String(payload.name ?? ""),
      guesthouseId: payload.guesthouseId,
      guesthouseName: String(payload.guesthouseName ?? ""),
      island: String(payload.island ?? ""),
      plan: String(payload.plan ?? "starter"),
    };
  } catch {
    return null;
  }
}
