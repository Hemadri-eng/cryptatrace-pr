import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    organization_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        organization_name: form.organization_name,
        email: form.email,
        password: form.password,
      });
      navigate("/");
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.detail || `Registration failed (HTTP ${err.response.status}).`);
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

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 py-10">
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-display font-semibold text-ink-900 tracking-tight">CRYPTATRACE</h1>
          <p className="text-sm text-ink-600/70 mt-1.5 text-center">solving transaction fraud</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-900 mb-1">Register your institution</h2>
          <p className="text-xs text-ink-600/60 mb-5">
            This creates a new, isolated workspace for your organization. You'll be its first
            admin and can add investigator accounts afterward.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600/70 mb-1.5">Your full name</label>
              <input
                required
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Jordan Lee"
                className="w-full rounded-md bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus-ring focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600/70 mb-1.5">Organization / unit name</label>
              <input
                required
                value={form.organization_name}
                onChange={set("organization_name")}
                placeholder="Metro Cyber Crime Cell"
                className="w-full rounded-md bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus-ring focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600/70 mb-1.5">Work email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="you@yourunit.gov"
                className="w-full rounded-md bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus-ring focus:border-cyan-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-600/70 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={set("password")}
                  placeholder="At least 8 characters"
                  className="w-full rounded-md bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus-ring focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600/70 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  required
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="Repeat password"
                  className="w-full rounded-md bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus-ring focus:border-cyan-500"
                />
              </div>
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
              Create workspace
            </button>
          </form>

          <p className="text-xs text-ink-600/70 text-center pt-5 mt-5 border-t border-slate-200">
            Already registered?{" "}
            <Link to="/login" className="text-cyan-700 hover:text-cyan-800 font-medium">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
