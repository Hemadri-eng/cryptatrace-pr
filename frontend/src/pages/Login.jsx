import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
        setError(err.response.data?.detail || `Sign-in failed (HTTP ${err.response.status}).`);
      } else if (err.request) {
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
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-ink-900 flex items-center justify-center mb-4">
            <ShieldAlert size={26} className="text-cyan-400" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-display font-semibold text-ink-900 tracking-tight">CRYPTATRACE</h1>
          <p className="text-sm text-ink-600/70 mt-1.5 text-center">solving transaction fraud</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600/70 mb-1.5">
                Institutional email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@yourunit.gov"
                className="w-full rounded-md bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus-ring focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600/70 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-md bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus-ring focus:border-cyan-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-ink-950 hover:bg-ink-900 disabled:opacity-60 text-white font-medium text-sm py-2.5 transition-colors focus-ring"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-200 space-y-3">
            <button
              onClick={() => setShowDemo((s) => !s)}
              className="text-xs text-cyan-700 hover:text-cyan-800 focus-ring rounded"
            >
              {showDemo ? "Hide demo credentials" : "Use a demo account →"}
            </button>
            {showDemo && (
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className="w-full text-left rounded-md border border-slate-200 hover:border-cyan-400 hover:bg-slate-50 px-3 py-2 transition-colors focus-ring"
                  >
                    <div className="text-xs text-ink-900">{acc.label}</div>
                    <div className="text-[11px] text-ink-600/60 font-mono">{acc.email}</div>
                  </button>
                ))}
                <p className="text-[11px] text-ink-600/60 pt-1">
                  Demo password for all accounts: <span className="font-mono text-ink-700">{DEMO_PASSWORD}</span>
                </p>
              </div>
            )}

            <p className="text-xs text-ink-600/70 text-center pt-1">
              New organization?{" "}
              <Link to="/register" className="text-cyan-700 hover:text-cyan-800 font-medium">
                Register your institution →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-600/50 mt-6">
          Smart India Hackathon 2026 · Problem Statement 26183 · Prototype build
        </p>
      </div>
    </div>
  );
}
