import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, requireSameOrigin, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await destroySession(token);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
