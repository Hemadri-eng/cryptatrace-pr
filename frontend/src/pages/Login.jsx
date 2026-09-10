import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Investigator — Athens Cyber Crime Unit", email: "investigator@athens.demo" },
  { label: "Institution Admin — Athens Cyber Crime Unit", email: "admin@athens.demo" },
  { label: "Investigator — Demo Financial Intelligence Unit", email: "investigator@dfiu.demo" },
  { label: "Super Admin — System", email: "superadmin@athens.demo" },
];
const DEMO_PASSWORD = "Athens@2026";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err.response) {
        // Backend responded - show its actual reason (e.g. "Invalid email or password",
        // "Account disabled"), never a generic message that hides what went wrong.
        setError(err.response.data?.detail || `Sign-in failed (HTTP ${err.response.status}).`);
      } else if (err.request) {
        // Request was sent but no response came back - almost always a wrong
        // VITE_API_URL, a sleeping/unreachable backend, or a CORS rejection.
        setError(
          "Could not reach the CRYPTATRACE backend. Check that the server is running and that " +
          "the app is configured with the correct API URL."
        );
      } else {
        setError("Something went wrong before the request could be sent. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* subtle grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#4dd8e6 1px, transparent 1px), linear-gradient(90deg, #4dd8e6 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-4">
            <ShieldAlert size={28} className="text-cyan-300" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-tight">CRYPTATRACE</h1>
          <p className="text-sm text-slate-400 mt-1.5 text-center">
            solving transaction fraud
          </p>
        </div>

        <div className="bg-ink-900 border border-white/10 rounded-xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Institutional email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@yourunit.gov"
                className="w-full rounded-md bg-ink-800 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus-ring focus:border-cyan-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-md bg-ink-800 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus-ring focus:border-cyan-400/50"
              />
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-ink-950 font-medium text-sm py-2.5 transition-colors focus-ring"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/10">
            <button
              onClick={() => setShowDemo((s) => !s)}
              className="text-xs text-cyan-300 hover:text-cyan-200 focus-ring rounded"
            >
              {showDemo ? "Hide demo credentials" : "Use a demo account →"}
            </button>
            {showDemo && (
              <div className="mt-3 space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => fillDemo(acc.email)}
                    className="w-full text-left rounded-md border border-white/10 hover:border-cyan-400/30 hover:bg-white/5 px-3 py-2 transition-colors focus-ring"
                  >
                    <div className="text-xs text-white">{acc.label}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{acc.email}</div>
                  </button>
                ))}
                <p className="text-[11px] text-slate-500 pt-1">
                  Demo password for all accounts: <span className="font-mono text-slate-400">{DEMO_PASSWORD}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Smart India Hackathon 2026 · Problem Statement 26183 · Prototype build
        </p>
      </div>
    </div>
  );
}
