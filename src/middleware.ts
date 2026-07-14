import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Hrubá ochrana privátních rout (jemná autorizace probíhá vždy v akcích/handlerech).
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("cookus_session")?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      valid = true;
    } catch {
      valid = false;
    }
  }
  if (!valid) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/friends",
    "/invite",
    "/messages/:path*",
    "/notifications",
    "/settings/:path*",
    "/applications",
    "/verifications",
    "/admin/:path*",
    "/jobs/new",
    "/jobs/:id/applicants",
    "/jobs/:id/edit",
    "/post/new",
  ],
};
