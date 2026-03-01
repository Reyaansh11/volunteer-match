import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ServeConnect",
  description: "Connect students with local service opportunities",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }]
  }
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-brand-700">
              ServeConnect
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/opportunities" className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">
                Opportunities
              </Link>
              {user ? (
                <>
                  <Link
                    href={user.role === "STUDENT" ? "/dashboard/student" : "/dashboard/org"}
                    className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
                  >
                    Dashboard
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">
                    Log in
                  </Link>
                  <Link href="/register" className="rounded-md bg-brand-700 px-3 py-1.5 text-white hover:bg-brand-500">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
