import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { casesApi } from "../services/resources";
import RiskBadge from "../components/RiskBadge";
import { truncateAddr, formatDate } from "../utils/format";

const STATUS_OPTIONS = ["All", "Draft", "Submitted", "Under Investigation", "High Risk", "Resolved", "Archived"];
const RISK_OPTIONS = ["All", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [risk, setRisk] = useState("All");

  const load = () => {
    setLoading(true);
    casesApi
      .list({
        search: search || undefined,
        status_filter: status !== "All" ? status : undefined,
        risk_filter: risk !== "All" ? risk : undefined,
      })
      .then((res) => setCases(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, risk]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-ink-900">Cases</h1>
          <p className="text-sm text-ink-600/70 mt-0.5">All cases reported to your institution.</p>
        </div>
        <Link
          to="/new-report"
          className="inline-flex items-center gap-2 bg-ink-950 hover:bg-ink-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={16} /> New Report
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Case ID, wallet, or transaction hash..."
            className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-2 text-sm focus-ring focus:border-cyan-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring"
        >
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring"
        >
          {RISK_OPTIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-ink-600/60 border-b border-slate-200 bg-slate-50">
                <th className="font-medium px-4 py-2.5">Case ID</th>
                <th className="font-medium px-3 py-2.5">Title</th>
                <th className="font-medium px-3 py-2.5">Wallet / Tx</th>
                <th className="font-medium px-3 py-2.5">Risk</th>
                <th className="font-medium px-3 py-2.5">Status</th>
                <th className="font-medium px-3 py-2.5">Created</th>
                <th className="font-medium px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-600/50">Loading cases…</td></tr>
              )}
              {!loading && cases.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-600/50">No cases match these filters.</td></tr>
              )}
              {!loading && cases.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-900">{c.case_number}</td>
                  <td className="px-3 py-2.5 max-w-[220px] truncate">{c.title}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-600/80">
                    {truncateAddr(c.wallet_address || c.transaction_hash)}
                  </td>
                  <td className="px-3 py-2.5"><RiskBadge level={c.risk_level} /></td>
                  <td className="px-3 py-2.5 text-xs text-ink-600/80">{c.status}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-600/60">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link to={`/cases/${c.id}`} className="text-cyan-600 hover:text-cyan-700 text-xs font-medium">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
