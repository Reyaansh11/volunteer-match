import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "vm_session";
const SESSION_DAYS = 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 14);
}

export async function verifyPassword(password: string, passwordHash: string) {
  const bcryptLike = passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$");
  if (bcryptLike) {
    return bcrypt.compare(password, passwordHash);
  }

  // Backward compatibility for earlier prototype accounts that used sha256 directly.
  const legacyHash = createHash("sha256").update(password).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(legacyHash), Buffer.from(passwordHash));
  } catch {
    return false;
  }
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

  // Reject if neither header is present — don't allow unverifiable origin.
  return false;
}

/** Prevent open-redirect attacks — only allow relative internal paths. */
export function safeRedirectTo(input: string, fallback = "/"): string {
  if (typeof input === "string" && input.startsWith("/") && !input.startsWith("//")) {
    return input;
  }
  return fallback;
}

/**
 * Look up the geographic center of a US ZIP code via the free Zippopotam.us API.
 * Falls back to a rough regional estimate if the API is unavailable so registration
 * never hard-fails. Real coordinates are what matter for distance matching.
 */
export async function lookupZipLatLng(zipCode: string): Promise<{ lat: number; lng: number }> {
  const safeZip = zipCode.replace(/\D/g, "").slice(0, 5).padStart(5, "0");

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${safeZip}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json() as { places?: { latitude: string; longitude: string }[] };
      const place = data.places?.[0];
      if (place?.latitude && place?.longitude) {
        return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) };
      }
    }
  } catch {
    // API unreachable — fall through to regional estimate
  }

  // Regional fallback by ZIP prefix so at least the region is right
  const numeric = Number(safeZip);
  if (numeric < 20000) return { lat: 42.5,  lng: -71.0  }; // New England
  if (numeric < 30000) return { lat: 38.9,  lng: -77.0  }; // Mid-Atlantic
  if (numeric < 40000) return { lat: 33.7,  lng: -84.4  }; // Southeast
  if (numeric < 50000) return { lat: 39.9,  lng: -82.9  }; // Ohio Valley
  if (numeric < 60000) return { lat: 44.9,  lng: -93.1  }; // Upper Midwest
  if (numeric < 70000) return { lat: 41.8,  lng: -87.6  }; // Great Lakes
  if (numeric < 80000) return { lat: 29.7,  lng: -95.3  }; // South Central
  if (numeric < 90000) return { lat: 39.7,  lng: -104.9 }; // Mountain
  return                       { lat: 37.7,  lng: -122.4 };  // West Coast
}

/** @deprecated Use lookupZipLatLng (async) instead. */
export function estimateLatLngFromZip(zipCode: string) {
  const numeric = Number(zipCode.replace(/\D/g, "").slice(0, 5) || "0");
  if (numeric < 20000) return { lat: 42.5,  lng: -71.0  };
  if (numeric < 30000) return { lat: 38.9,  lng: -77.0  };
  if (numeric < 40000) return { lat: 33.7,  lng: -84.4  };
  if (numeric < 50000) return { lat: 39.9,  lng: -82.9  };
  if (numeric < 60000) return { lat: 44.9,  lng: -93.1  };
  if (numeric < 70000) return { lat: 41.8,  lng: -87.6  };
  if (numeric < 80000) return { lat: 29.7,  lng: -95.3  };
  if (numeric < 90000) return { lat: 39.7,  lng: -104.9 };
  return                       { lat: 37.7,  lng: -122.4 };
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

function parseAvailabilityByDay(formData: FormData, prefix: string) {
  const days = formData
    .getAll(`${prefix}Days`)
    .map((value) => String(value).trim())
    .filter(Boolean);

  const availability: string[] = [];
  for (const day of days) {
    const start = String(formData.get(`${prefix}Start_${day}`) || "").trim();
    const end = String(formData.get(`${prefix}End_${day}`) || "").trim();
    if (!start || !end || start >= end) {
      continue;
    }
    availability.push(`${day} ${start}-${end}`);
  }

  return availability;
}

export function buildAvailabilityFromForm(formData: FormData, prefix: string, fallbackFieldName?: string) {
  const byDay = parseAvailabilityByDay(formData, prefix);
  const bySlot = [...parseAvailabilitySlot(formData, prefix, 1), ...parseAvailabilitySlot(formData, prefix, 2)];
  const deduped = Array.from(new Set([...byDay, ...bySlot]));
  if (deduped.length > 0) {
    return deduped.join("; ");
  }

  if (fallbackFieldName) {
    return String(formData.get(fallbackFieldName) || "").trim();
  }

  return "";
}
