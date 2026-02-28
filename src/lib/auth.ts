import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "vm_session";
const SESSION_DAYS = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function normalizeRole(input: string | null): UserRole | null {
  if (input === UserRole.STUDENT || input === UserRole.ORG) {
    return input;
  }
  return null;
}

export async function createSession(userId: number) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt
    }
  });

  return { token: rawToken, expiresAt };
}

export async function destroySession(token: string) {
  await prisma.session.deleteMany({
    where: {
      tokenHash: hashToken(token)
    }
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          student: true,
          org: true
        }
      }
    }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session.user;
}

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  };
}

export function requireSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export function estimateLatLngFromZip(zipCode: string) {
  const safeZip = zipCode.replace(/\D/g, "").slice(0, 5);
  const numeric = Number(safeZip || "85000");
  const offset = (numeric % 100) / 500;
  return {
    lat: 33.45 + offset,
    lng: -112.07 + offset / 2
  };
}

export function parseSkills(input: string) {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}
