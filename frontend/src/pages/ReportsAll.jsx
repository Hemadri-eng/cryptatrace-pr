import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { reportsApi } from "../services/resources";
import { formatDate, truncateAddr } from "../utils/format";

function openReport(report) {
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(report.html_content);
    w.document.close();
  }
}

export default function ReportsAll() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.listAll().then((res) => setItems(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Reports</h1>
        <p className="text-sm text-ink-600/70 mt-0.5">
          Generated investigation reports for your institution.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-ink-600/60 border-b border-slate-200 bg-slate-50">
                <th className="font-medium px-4 py-2.5">Report No.</th>
                <th className="font-medium px-3 py-2.5">Investigation</th>
                <th className="font-medium px-3 py-2.5">Generated</th>
                <th className="font-medium px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-600/50">Loading reports…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-600/50">No reports generated yet.</td></tr>
              )}
              {!loading && items.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-900">{r.report_number}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-600/70">{truncateAddr(r.investigation_id, 8)}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-600/60">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => openReport(r)}
                      className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 text-xs font-medium"
                    >
                      <FileText size={13} /> View
                    </button>
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
