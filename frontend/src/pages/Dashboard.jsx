import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { FolderOpen, AlertTriangle, ShieldCheck, Wallet, Building2, Activity } from "lucide-react";
import { dashboardApi } from "../services/resources";
import RiskBadge from "../components/RiskBadge";
import { truncateAddr, formatDate, riskColor } from "../utils/format";

const KPI_CONFIG = [
  { key: "total_cases", label: "Total Cases", icon: FolderOpen, tint: "navy" },
  { key: "open_cases", label: "Open Cases", icon: Activity, tint: "amber" },
  { key: "high_risk_cases", label: "High Risk Cases", icon: AlertTriangle, tint: "red" },
  { key: "investigations_completed", label: "Investigations Completed", icon: ShieldCheck, tint: "emerald" },
  { key: "suspicious_wallets", label: "Suspicious Wallets", icon: Wallet, tint: "orange" },
  { key: "exchanges_identified", label: "Exchanges Identified", icon: Building2, tint: "navy" },
];

const TINT_STYLES = {
  navy: "bg-ink-900/5 text-ink-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  emerald: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!data) return null;

  const pieData = Object.entries(data.risk_distribution)
    .filter(([, v]) => v > 0)
    .map(([level, value]) => ({ name: level, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-600/70 mt-0.5">
          Overview of case activity and fund-flow intelligence for your institution.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_CONFIG.map(({ key, label, icon: Icon, tint }) => (
          <div key={key} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2.5 ${TINT_STYLES[tint]}`}>
              <Icon size={16} strokeWidth={1.8} />
            </div>
            <div className="text-2xl font-semibold text-ink-900 tabular-nums">{data.stats[key]}</div>
            <div className="text-xs text-ink-600/70 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink-900">Recent Cases</h2>
            <Link to="/cases" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs text-ink-600/60 border-b border-slate-200">
                  <th className="font-medium px-5 py-2">Case ID</th>
                  <th className="font-medium px-2 py-2">Wallet / Tx</th>
                  <th className="font-medium px-2 py-2">Risk</th>
                  <th className="font-medium px-2 py-2">Status</th>
                  <th className="font-medium px-5 py-2 text-right">Reported</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_cases.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-600/50 text-sm">No cases yet.</td></tr>
                )}
                {data.recent_cases.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-2.5">
                      <Link to={`/cases/${c.id}`} className="font-medium text-cyan-700 hover:underline font-mono text-xs">
                        {c.case_number}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-ink-600/80">{truncateAddr(c.wallet_or_tx)}</td>
                    <td className="px-2 py-2.5"><RiskBadge level={c.risk_level} /></td>
                    <td className="px-2 py-2.5 text-xs text-ink-600/80">{c.status}</td>
                    <td className="px-5 py-2.5 text-xs text-ink-600/60 text-right">{formatDate(c.reported_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-ink-900 mb-2">Risk Distribution</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-ink-600/50 py-8 text-center">No investigated cases yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={riskColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-4">Recent Investigation Activity</h2>
        <ol className="relative border-l border-slate-200 ml-2 space-y-5">
          {data.recent_activity.length === 0 && (
            <p className="text-sm text-ink-600/50">No activity recorded yet.</p>
          )}
          {data.recent_activity.map((a, i) => (
            <li key={i} className="ml-4">
              <div className="absolute w-2 h-2 bg-ink-700 rounded-full -left-[4.5px] mt-1.5" />
              <p className="text-sm text-ink-900">{a.action}</p>
              <p className="text-xs text-ink-600/60">{formatDate(a.timestamp)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-40 bg-slate-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-lg" />
    </div>
  );
}
