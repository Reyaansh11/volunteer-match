import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

function isAuthorized(request: Request) {
  const token = request.headers.get("x-admin-token");
  const secret = process.env.ADMIN_SECRET;
  if (!token || !secret) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.communityPost.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    title?: string;
    slug?: string;
    summary?: string;
    body?: string;
    published?: boolean;
  };

  const { title, slug, summary, body: postBody, published } = body;

  if (!title?.trim() || !slug?.trim() || !summary?.trim() || !postBody?.trim()) {
    return NextResponse.json({ error: "title, slug, summary, and body are all required" }, { status: 400 });
  }

  // Sanitise slug: lowercase, alphanumeric + hyphens only
  const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  try {
    const post = await prisma.communityPost.create({
      data: {
        title: title.trim(),
        slug: safeSlug,
        summary: summary.trim(),
        body: postBody.trim(),
        published: published ?? true
      }
    });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Slug already exists — choose a different one." }, { status: 409 });
  }
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { id?: number };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.communityPost.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
