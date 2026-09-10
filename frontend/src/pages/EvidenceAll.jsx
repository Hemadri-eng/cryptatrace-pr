import { useEffect, useState } from "react";
import { evidenceApi } from "../services/resources";
import { truncateAddr, formatDate } from "../utils/format";

export default function EvidenceAll() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evidenceApi.listAll().then((res) => setItems(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Evidence</h1>
        <p className="text-sm text-ink-600/70 mt-0.5">
          All supporting transaction evidence collected across your institution's investigations.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-xs text-ink-600/60 border-b border-slate-200 bg-slate-50">
                <th className="font-medium px-4 py-2.5">Evidence ID</th>
                <th className="font-medium px-3 py-2.5">Tx Hash</th>
                <th className="font-medium px-3 py-2.5">Source → Destination</th>
                <th className="font-medium px-3 py-2.5">Amount</th>
                <th className="font-medium px-3 py-2.5">Blockchain</th>
                <th className="font-medium px-3 py-2.5">Timestamp</th>
                <th className="font-medium px-3 py-2.5">Finding</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-600/50">Loading evidence…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-600/50">No evidence recorded yet.</td></tr>
              )}
              {!loading && items.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-900">{e.evidence_code}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-cyan-700">{truncateAddr(e.transaction_hash, 10)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-600/80">
                    {truncateAddr(e.source_wallet, 6)} → {truncateAddr(e.destination_wallet, 6)}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{e.amount} {e.token}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-600/70">{e.blockchain}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-600/60">{formatDate(e.timestamp)}</td>
                  <td className="px-3 py-2.5 text-xs">{e.finding_supported}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
