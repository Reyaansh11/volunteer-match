import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.communityPost.findUnique({ where: { slug, published: true } });
  if (!post) return { title: "Post Not Found · ServeConnect" };
  return {
    title: `${post.title} · ServeConnect`,
    description: post.summary
  };
}

/**
 * Converts the plain-text post body to React elements.
 * Rules:
 *   - Lines starting with "## " become <h2> headings
 *   - Lines starting with "? "  are FAQ items: "? Question\nAnswer" in one block
 *   - Blank lines (or \n\n) separate paragraphs / FAQ pairs
 *   - Everything else is a paragraph
 */
function renderBody(body: string) {
  const blocks = body.split(/\n{2,}/);
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const trimmed = blocks[i].trim();
    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="mt-8 text-xl font-semibold text-slate-900">
          {trimmed.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("? ")) {
      // Question and answer live in the same block, separated by a single \n
      const newlineIdx = trimmed.indexOf("\n");
      const question = newlineIdx > 0 ? trimmed.slice(2, newlineIdx).trim() : trimmed.slice(2).trim();
      const answer   = newlineIdx > 0 ? trimmed.slice(newlineIdx + 1).trim() : "";
      elements.push(
        <div key={i} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="font-semibold text-slate-900">{question}</p>
          {answer ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{answer}</p> : null}
        </div>
      );
      i++; // this block contained both; just advance by one
      continue;
    }

    elements.push(
      <p key={i} className="mt-4 leading-relaxed text-slate-700">
        {trimmed}
      </p>
    );
    i++;
  }
  return elements;
}

export default async function CommunityPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.communityPost.findUnique({ where: { slug, published: true } });
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        In the Community
      </Link>

      {/* Article */}
      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-base font-medium text-slate-500">{post.summary}</p>

        <hr className="my-6 border-slate-200" />

        <div className="prose-style">{renderBody(post.body)}</div>

        <hr className="my-8 border-slate-200" />

        {/* CTA */}
        <div className="rounded-xl bg-brand-50 p-5">
          <p className="text-sm font-semibold text-brand-700">Ready to get started?</p>
          <p className="mt-1 text-sm text-slate-600">
            ServeConnect is free for students and organizations. Setup takes about five minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/register/student"
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
            >
              Start Tracking Hours Free
            </Link>
            <Link
              href="/register/org"
              className="rounded-lg border border-brand-700/30 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
            >
              Register Your Chapter
            </Link>
          </div>
        </div>
      </article>

      {/* Back at bottom */}
      <div className="mt-6">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          All posts
        </Link>
      </div>
    </main>
  );
}
