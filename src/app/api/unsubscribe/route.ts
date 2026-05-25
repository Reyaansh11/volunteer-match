import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?unsubscribe=invalid", request.url));
  }

  const student = await prisma.studentProfile.findUnique({
    where: { unsubscribeToken: token }
  });

  if (!student) {
    return NextResponse.redirect(new URL("/?unsubscribe=invalid", request.url));
  }

  await prisma.studentProfile.update({
    where: { id: student.id },
    data: { emailUnsubscribed: true }
  });

  return NextResponse.redirect(new URL("/?unsubscribe=success", request.url));
}
