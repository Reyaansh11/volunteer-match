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
  const bcryptLike = passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$");
  if (bcryptLike) {
    return bcrypt.compare(password, passwordHash);
  }

  // Backward compatibility for earlier prototype accounts that used sha256 directly.
  const legacyHash = createHash("sha256").update(password).digest("hex");
  return legacyHash === passwordHash;
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
  try {
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
  } catch (error) {
    console.error("getCurrentUser failed", error);
    return null;
  }
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
  const referer = request.headers.get("referer");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) {
    return true;
  }

  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  // Some clients omit both headers for same-site form posts.
  return true;
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

export function parseSkillsFromForm(formData: FormData, fieldName: string, customFieldName: string) {
  const selected = formData
    .getAll(fieldName)
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);
  const custom = String(formData.get(customFieldName) || "").trim().toLowerCase();
  const merged = [...selected, ...parseSkills(custom)];
  return Array.from(new Set(merged));
}

export function resolveCommitmentFromForm(
  formData: FormData,
  presetFieldName: string,
  customFieldName: string,
  fallbackFieldName?: string
) {
  const preset = String(formData.get(presetFieldName) || "").trim();
  if (preset && preset !== "custom") {
    return preset;
  }

  const custom = String(formData.get(customFieldName) || "").trim();
  if (custom) {
    return custom;
  }

  if (fallbackFieldName) {
    const fallback = String(formData.get(fallbackFieldName) || "").trim();
    if (fallback) {
      return fallback;
    }
  }

  return "";
}

function parseAvailabilitySlot(formData: FormData, prefix: string, slotNumber: number) {
  const days = formData
    .getAll(`${prefix}Days${slotNumber}`)
    .map((value) => String(value).trim())
    .filter(Boolean);
  const start = String(formData.get(`${prefix}Start${slotNumber}`) || "").trim();
  const end = String(formData.get(`${prefix}End${slotNumber}`) || "").trim();

  if (!days.length || !start || !end) {
    return [];
  }
  if (start >= end) {
    return [];
  }

  return days.map((day) => `${day} ${start}-${end}`);
}

export function buildAvailabilityFromForm(formData: FormData, prefix: string, fallbackFieldName?: string) {
  const slots = [...parseAvailabilitySlot(formData, prefix, 1), ...parseAvailabilitySlot(formData, prefix, 2)];
  const deduped = Array.from(new Set(slots));
  if (deduped.length > 0) {
    return deduped.join("; ");
  }

  if (fallbackFieldName) {
    return String(formData.get(fallbackFieldName) || "").trim();
  }

  return "";
}
