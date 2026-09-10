import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, institution } = useAuth();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-600/70 mt-0.5">Your account details on this platform.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
        <Row label="Full name" value={user?.full_name} />
        <Row label="Email" value={user?.email} />
        <Row label="Role" value={user?.role?.replace("_", " ")} />
        <Row label="Badge ID" value={user?.badge_id || "—"} />
        <Row label="Institution" value={institution?.name || "System-level account"} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-1">About CRYPTATRACE</h2>
        <p className="text-xs text-ink-600/70 leading-relaxed">
          CRYPTATRACE is a prototype built for Smart India Hackathon 2026, Problem Statement 26183:
          Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported
          Suspect Wallet Addresses through Automated Blockchain Analytics. All blockchain data in
          this build is simulated for demonstration purposes.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 pb-3 last:pb-0">
      <span className="text-ink-600/60">{label}</span>
      <span className="text-ink-900 font-medium">{value}</span>
    </div>
  );
}
