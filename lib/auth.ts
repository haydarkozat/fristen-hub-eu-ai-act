// Sunucu bileşenleri için oturum yardımcıları (next/headers kullanır → sadece Node).
import { cookies } from "next/headers";
import { SESSION_COOKIE, type SessionPayload, verifySession } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}
