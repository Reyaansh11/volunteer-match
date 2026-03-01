import Link from "next/link";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
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
  const navItemClass = "w-full rounded-md px-3 py-2 text-center text-sm font-medium";

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight text-brand-700">
              ServeConnect
            </Link>
            <nav className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:auto-cols-max sm:grid-flow-col">
              <Link href="/opportunities" className={`${navItemClass} text-slate-700 hover:bg-slate-100`}>
                Opportunities
              </Link>
              {user ? (
                <>
                  <Link
                    href={user.role === "STUDENT" ? "/dashboard/student" : "/dashboard/org"}
                    className={`${navItemClass} text-slate-700 hover:bg-slate-100`}
                  >
                    Dashboard
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className={`${navItemClass} bg-slate-800 text-white hover:bg-slate-700`}>
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
