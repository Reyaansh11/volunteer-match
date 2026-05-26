"use client";

import { useEffect, useState } from "react";

type Org = {
  id: number;
  organization: string;
  category: string;
  contactName: string;
  contactEmail: string;
  websiteUrl: string;
  city: string | null;
  state: string | null;
  status: string;
  adminNote: string | null;
  user: { email: string; createdAt: string };
};

type CommunityPost = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  published: boolean;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  YELLOW: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-800"
};

const SEO_POST = {
  title: "Why I Built ServeConnect: NHS Service Hours Shouldn't Require This Much Paperwork",
  slug: "nhs-service-hour-tracking",
  summary:
    "NHS and NJHS chapters still track service hours on paper forms passed around in hallways. I built ServeConnect to fix that, and here is how it works.",
  body: `## The Problem I Kept Seeing

Every NHS and NJHS chapter in the country has the same workflow: students find their own volunteer opportunities, show up, get a paper form signed by a supervisor, and hand it to their advisor. The advisor collects the forms, tallies the hours, and hopes nothing gets lost.

That system works fine for a chapter of ten students. It falls apart at forty. At eighty it is a genuine mess.

Students forget to get forms signed. Forms get lost. Advisors spend their free periods tracking down missing paperwork from organizations that may or may not remember which student came in three weeks ago. The whole thing runs on good intentions and a lot of follow-up emails.

I wanted to build something better.

## What ServeConnect Does

ServeConnect is a free platform that connects NHS and NJHS students with vetted local organizations. Students build a profile with their skills, availability, and service goals. Organizations post opportunities with specific schedules and what kind of help they need. The platform matches students to opportunities based on location, availability, and fit.

When both sides accept a match, contact information is shared and the service relationship begins. After the student completes their hours, the organization logs the completion directly through the platform. A verified service record is generated automatically.

No paper forms. No missing signatures. The record lives in the system and the student can share it with their advisor whenever they need it.

## How the Matching Works

The matching algorithm factors in distance from the student's ZIP code, weekly availability, and skills. A student who is free on Saturday mornings and has tutoring experience will see tutoring opportunities nearby ranked higher than anything else.

Organizations are reviewed and approved before they can post. Students only see legitimate community programs, not random postings from the internet.

## For Advisors

Advisors do not need to set anything up. Students register on their own, find opportunities, and complete their service. The advisor can ask a student to share their service record at any time and it is already there, complete with the organization name, hours, date, and supervisor confirmation.

The goal was to make the advisor's job as hands-off as possible while keeping the verification rigorous.

## Try It

ServeConnect is free for both students and organizations. If you want to see it in action or have questions about how it works for your chapter, reach out at reyaansh.tomar11@gmail.com.

serveconnect.org`
};

export default function AdminPage() {
  const [token, setToken] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("admin_token") ?? "" : ""
  );
  const [authed, setAuthed] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  // Community post form state
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postPublished, setPostPublished] = useState(true);
  const [postError, setPostError] = useState("");
  const [postBusy, setPostBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"orgs" | "posts">("orgs");

  async function load(t: string) {
    const res = await fetch("/api/admin/orgs", { headers: { "x-admin-token": t } });
    if (!res.ok) { setError("Invalid token"); return; }
    const data = await res.json();
    setOrgs(data.orgs ?? data);
    sessionStorage.setItem("admin_token", t);
    setAuthed(true);
    loadPosts(t);
  }

  async function loadPosts(t: string) {
    const res = await fetch("/api/admin/community", { headers: { "x-admin-token": t } });
    if (!res.ok) return;
    const data = await res.json();
    setPosts(data.posts ?? []);
  }

  async function act(orgId: number, action: string) {
    setBusy(orgId);
    await fetch("/api/admin/orgs", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ orgId, action, note: note[orgId] ?? "" })
    });
    await load(token);
    setBusy(null);
  }

  async function createPost() {
    setPostError("");
    if (!postTitle || !postSlug || !postSummary || !postBody) {
      setPostError("All fields except Published are required.");
      return;
    }
    setPostBusy(true);
    const res = await fetch("/api/admin/community", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": token },
      body: JSON.stringify({
        title: postTitle,
        slug: postSlug,
        summary: postSummary,
        body: postBody,
        published: postPublished
      })
    });
    const data = await res.json();
    setPostBusy(false);
    if (!res.ok) { setPostError(data.error ?? "Failed to create post."); return; }
    // Clear form
    setPostTitle(""); setPostSlug(""); setPostSummary(""); setPostBody(""); setPostPublished(true);
    await loadPosts(token);
  }

  async function deletePost(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch("/api/admin/community", {
      method: "DELETE",
      headers: { "content-type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id })
    });
    await loadPosts(token);
  }

  function fillSeoPost() {
    setPostTitle(SEO_POST.title);
    setPostSlug(SEO_POST.slug);
    setPostSummary(SEO_POST.summary);
    setPostBody(SEO_POST.body);
    setPostPublished(true);
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-lg font-semibold text-slate-900">Admin Access</h1>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <input
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={() => load(token)} className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Enter
          </button>
        </div>
      </main>
    );
  }

  const pending = orgs.filter((o) => o.status === "PENDING");
  const rest = orgs.filter((o) => o.status !== "PENDING");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Admin Panel</h1>

      {/* Tab switcher */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("orgs")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "orgs" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}
        >
          Organization Review
          {pending.length > 0 ? (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
              {pending.length}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "posts" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}
        >
          Community Posts
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {posts.length}
          </span>
        </button>
      </div>

      {/* ── Organization Review Tab ── */}
      {activeTab === "orgs" && (
        <>
          {pending.length === 0 ? (
            <p className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No pending organizations.</p>
          ) : null}

          {[...pending, ...rest].map((org) => (
            <div key={org.id} className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[org.status] ?? ""}`}>{org.status}</span>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">{org.organization}</h2>
                  <p className="text-sm text-slate-500">{org.category} {org.city ? `· ${org.city}, ${org.state}` : ""}</p>
                  <p className="mt-1 text-sm text-slate-700">Contact: {org.contactName} &lt;{org.contactEmail}&gt;</p>
                  <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-blue-600 underline">{org.websiteUrl}</a>
                  <p className="mt-1 text-xs text-slate-400">Registered: {new Date(org.user.createdAt).toLocaleDateString()}</p>
                  {org.adminNote ? <p className="mt-1 text-xs text-orange-700">Note: {org.adminNote}</p> : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <textarea
                  rows={2}
                  placeholder="Optional note (required for yellow flag, sent to org)"
                  value={note[org.id] ?? ""}
                  onChange={(e) => setNote((prev) => ({ ...prev, [org.id]: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
                <button disabled={busy === org.id} onClick={() => act(org.id, "approve")} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50">
                  Approve
                </button>
                <button disabled={busy === org.id} onClick={() => act(org.id, "yellow")} className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50">
                  Yellow Flag
                </button>
                <button disabled={busy === org.id} onClick={() => { if (confirm(`Delete ${org.organization} and block their email?`)) act(org.id, "reject"); }} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50">
                  Red Flag &amp; Delete
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Community Posts Tab ── */}
      {activeTab === "posts" && (
        <div className="space-y-6">

          {/* Create post form */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold text-slate-900">New Post</h2>
              <button
                onClick={fillSeoPost}
                className="rounded-md border border-brand-700/30 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                Fill with SEO launch post ↓
              </button>
            </div>

            {postError ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{postError}</p>
            ) : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Title *
                <input
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="The NHS Service Hour Problem Nobody Talks About"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Slug *
                <input
                  value={postSlug}
                  onChange={(e) => setPostSlug(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                  placeholder="nhs-service-hour-tracking"
                />
                <span className="mt-1 block text-xs text-slate-400">URL: /community/[slug]</span>
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700 self-end pb-2">
                <input
                  type="checkbox"
                  checked={postPublished}
                  onChange={(e) => setPostPublished(e.target.checked)}
                  className="h-4 w-4"
                />
                Published (visible to everyone)
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Summary *
                <textarea
                  value={postSummary}
                  onChange={(e) => setPostSummary(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="One or two sentences shown on the listing page and in metadata."
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Body *
                <span className="ml-2 text-xs font-normal text-slate-400">
                  Use <code className="bg-slate-100 px-1 rounded">## Heading</code> for headings. Blank lines become paragraph breaks.
                </span>
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  rows={16}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm leading-relaxed"
                  placeholder="## Introduction&#10;&#10;Write your post here..."
                />
              </label>
            </div>

            <button
              onClick={createPost}
              disabled={postBusy}
              className="mt-4 rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50 transition-colors"
            >
              {postBusy ? "Publishing…" : "Publish Post"}
            </button>
          </section>

          {/* Existing posts list */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              {posts.length === 0 ? "No posts yet." : `Published Posts (${posts.length})`}
            </h2>
            {posts.map((post) => (
              <div key={post.id} className="mb-3 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${post.published ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                      {post.published ? "Live" : "Draft"}
                    </span>
                    <p className="truncate text-sm font-semibold text-slate-900">{post.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    /community/{post.slug} &nbsp;·&nbsp;{" "}
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{post.summary}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/community/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    View
                  </a>
                  <button
                    onClick={() => deletePost(post.id, post.title)}
                    className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}
