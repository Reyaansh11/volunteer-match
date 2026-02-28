import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { createSession, getSessionCookieOptions, normalizeRole, requireSameOrigin, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = normalizeRole(String(formData.get("role") || ""));

  if (!email || !password || !role) {
    return NextResponse.redirect(new URL("/login?error=Missing+credentials", request.url), 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid || user.role !== role) {
    return NextResponse.redirect(new URL("/login?error=Invalid+credentials", request.url), 303);
  }

  const session = await createSession(user.id);
  const destination = user.role === UserRole.STUDENT ? "/dashboard/student" : "/dashboard/org";
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(SESSION_COOKIE, session.token, getSessionCookieOptions(session.expiresAt));

  return response;
}
