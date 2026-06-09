import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const isLogin = pathname === "/login";

  // Giriş yoksa korumalı sayfalardan /login'e yönlendir.
  if (!session && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // Girişliyse /login ve / kökünü panoya yönlendir.
  if (session && (isLogin || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Statik dosyalar ve _next hariç tüm yollar.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
