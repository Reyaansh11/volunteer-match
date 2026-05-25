import Link from "next/link";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

// Inter for all body/label text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

// Hanken Grotesk for all heading elements (applied globally via globals.css @layer base)
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  weight: ["600", "700", "800"],
  display: "swap"
});

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
  // nav item base — pill-shaped, consistent padding
  const navItemClass = "min-w-[120px] flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors sm:min-w-0 sm:flex-none";
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en" className={`h-full ${inter.variable} ${hanken.variable}`}>
      <body className="h-full bg-slate-50 font-sans text-slate-900">
        <div className="flex min-h-dvh flex-col">

          {/* ── Navigation ── */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {/* Logo */}
              <Link href="/" className="font-display text-lg font-bold tracking-tight text-brand-700">
                ServeConnect
              </Link>

              {/* Nav links */}
              <nav className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Link href="/opportunities" className={`${navItemClass} text-slate-700 hover:bg-slate-100`}>
                  Opportunities
                </Link>
                {user ? (
                  <>
                    {user.role === "ORG" ? (
                      <Link href="/onboarding/org" className={`${navItemClass} text-slate-700 hover:bg-slate-100`}>
                        Onboarding
                      </Link>
                    ) : null}
                    <Link
                      href={user.role === "STUDENT" ? "/dashboard/student" : "/dashboard/org"}
                      className={`${navItemClass} text-slate-700 hover:bg-slate-100`}
                    >
                      Dashboard
                    </Link>
                    <form action="/api/auth/logout" method="post">
                      {/* Dark button: inverse-surface base, brand-green on hover */}
                      <button
                        type="submit"
                        className={`${navItemClass} bg-slate-800 text-white hover:bg-brand-700`}
                      >
                        Log out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={`${navItemClass} text-slate-700 hover:bg-slate-100`}>
                      Log in
                    </Link>
                    <Link href="/register" className={`${navItemClass} bg-brand-700 text-white hover:bg-brand-500`}>
                      Sign up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          {/* ── Footer ── */}
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="font-medium text-slate-700">
                © {currentYear}{" "}
                <span className="font-bold text-brand-700">ServeConnect</span>. All rights reserved.
              </p>
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link href="/privacy" className="hover:text-brand-700 hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-brand-700 hover:underline">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="hover:text-brand-700 hover:underline">
                  Cookie Policy
                </Link>
              </nav>
            </div>
          </footer>

          <Analytics />
        </div>
      </body>
    </html>
  );
}
