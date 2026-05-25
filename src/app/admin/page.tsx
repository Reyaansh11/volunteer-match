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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  YELLOW: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-800"
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function load(t: string) {
    const res = await fetch("/api/admin/orgs", { headers: { "x-admin-token": t } });
    if (!res.ok) { setError("Invalid token"); return; }
    setOrgs(await res.json());
    setAuthed(true);
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
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Organization Review</h1>

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
              Red Flag & Delete
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}
