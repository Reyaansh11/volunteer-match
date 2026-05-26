import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "In the Community · ServeConnect",
  description:
    "Stories, updates, and insights from the ServeConnect community — where students and organizations are doing meaningful work together."
};

export default async function CommunityPage() {
  const posts = await prisma.communityPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, summary: true, createdAt: true }
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700">
          ServeConnect
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          In the Community
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Stories, advice, and updates from the ServeConnect community — where students and
          organizations are making service hours matter.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">No posts yet — check back soon.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                <Link href={`/community/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.summary}</p>
              <Link
                href={`/community/${post.slug}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-500 transition-colors"
              >
                Read more
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
