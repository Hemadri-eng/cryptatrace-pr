import { useEffect, useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { usersApi } from "../services/resources";

const ROLES = ["INVESTIGATOR", "INSTITUTION_ADMIN"];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "INVESTIGATOR", badge_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    usersApi.list().then((res) => setUsers(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await usersApi.create(form);
      setForm({ full_name: "", email: "", password: "", role: "INVESTIGATOR", badge_id: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-ink-900">Users</h1>
          <p className="text-sm text-ink-600/70 mt-0.5">Manage investigator and admin accounts for your institution.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-md">
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 max-w-lg">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Full name" value={form.full_name} onChange={set("full_name")}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring focus:border-cyan-400" />
            <input required placeholder="Badge ID" value={form.badge_id} onChange={set("badge_id")}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring focus:border-cyan-400" />
          </div>
          <input required type="email" placeholder="Email" value={form.email} onChange={set("email")}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring focus:border-cyan-400" />
          <input required type="password" placeholder="Temporary password" value={form.password} onChange={set("password")}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring focus:border-cyan-400" />
          <select value={form.role} onChange={set("role")}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring">
            {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-ink-950 font-semibold text-sm px-4 py-2 rounded-md">
            {saving && <Loader2 size={14} className="animate-spin" />} Create user
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-ink-600/60 border-b border-slate-200 bg-slate-50">
                <th className="font-medium px-4 py-2.5">Name</th>
                <th className="font-medium px-3 py-2.5">Email</th>
                <th className="font-medium px-3 py-2.5">Role</th>
                <th className="font-medium px-3 py-2.5">Badge</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-600/50">Loading users…</td></tr>}
              {!loading && users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-ink-900">{u.full_name}</td>
                  <td className="px-3 py-2.5 text-ink-600/80">{u.email}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-600/70">{u.role.replace("_", " ")}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-600/60">{u.badge_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
