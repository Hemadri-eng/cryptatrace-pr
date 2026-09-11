import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { casesApi } from "../services/resources";

const FRAUD_TYPES = [
  "Investment Scam", "Romance Scam", "Impersonation Scam", "Phishing",
  "Ponzi Scheme", "Fake Exchange", "Other",
];
const NETWORKS = ["Ethereum", "BSC", "Polygon", "Tron", "Bitcoin"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const initial = {
  title: "", description: "", incident_type: "Cyber Financial Fraud", priority: "Medium",
  input_type: "wallet", wallet_address: "", transaction_hash: "",
  network: "Ethereum", approx_amount: "", currency: "ETH",
  victim_notes: "", fraud_type: "Investment Scam",
};

export default function NewReport() {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (submitNow) => {
    setError("");
    if (form.input_type === "wallet" && !form.wallet_address.trim()) {
      setError("Wallet address is required.");
      return;
    }
    if (form.input_type === "transaction" && !form.transaction_hash.trim()) {
      setError("Transaction hash is required.");
      return;
    }
    if (!form.title.trim()) {
      setError("Case title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        approx_amount: form.approx_amount ? parseFloat(form.approx_amount) : null,
        submit_now: submitNow,
      };
      const res = await casesApi.create(payload);
      if (submitNow) {
        navigate(`/cases/${res.data.id}?investigate=1`);
      } else {
        navigate(`/cases/${res.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save the case. Please check the form.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-ring focus:border-cyan-400";
  const labelCls = "block text-xs font-medium text-ink-600/80 mb-1.5";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">New Report</h1>
        <p className="text-sm text-ink-600/70 mt-0.5">
          File a new cryptocurrency fraud report and route it for investigation.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3.5 py-2.5">
          {error}
        </div>
      )}

      <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-ink-900">Case Information</h2>
        <div>
          <label className={labelCls}>Case title</label>
          <input className={inputCls} value={form.title} onChange={set("title")}
            placeholder="e.g. Investment scam - fraudulent trading platform" />
        </div>
        <div>
          <label className={labelCls}>Case description</label>
          <textarea className={inputCls} rows={3} value={form.description} onChange={set("description")}
            placeholder="Brief description of the incident" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Incident type</label>
            <input className={inputCls} value={form.incident_type} onChange={set("incident_type")} />
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-ink-900">Cryptocurrency Information</h2>

        <div>
          <label className={labelCls}>Input type</label>
          <div className="flex gap-2">
            {["wallet", "transaction"].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm((f) => ({ ...f, input_type: t }))}
                className={`px-3.5 py-1.5 rounded-md text-sm border transition-colors ${
                  form.input_type === t
                    ? "bg-ink-950 text-white border-ink-950"
                    : "border-slate-200 text-ink-600/80 hover:border-slate-300"
                }`}
              >
                {t === "wallet" ? "Wallet Address" : "Transaction Hash"}
              </button>
            ))}
          </div>
        </div>

        {form.input_type === "wallet" ? (
          <div>
            <label className={labelCls}>Suspected wallet address</label>
            <input className={`${inputCls} font-mono`} value={form.wallet_address} onChange={set("wallet_address")}
              placeholder="0x..." />
          </div>
        ) : (
          <div>
            <label className={labelCls}>Transaction hash</label>
            <input className={`${inputCls} font-mono`} value={form.transaction_hash} onChange={set("transaction_hash")}
              placeholder="0x..." />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Blockchain / network</label>
            <select className={inputCls} value={form.network} onChange={set("network")}>
              {NETWORKS.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Approximate amount</label>
            <input type="number" step="any" className={inputCls} value={form.approx_amount} onChange={set("approx_amount")}
              placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Currency / token</label>
            <input className={inputCls} value={form.currency} onChange={set("currency")} placeholder="ETH" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Suspected fraud type</label>
          <select className={inputCls} value={form.fraud_type} onChange={set("fraud_type")}>
            {FRAUD_TYPES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Victim notes</label>
          <textarea className={inputCls} rows={3} value={form.victim_notes} onChange={set("victim_notes")}
            placeholder="Any additional context provided by the victim" />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={() => submit(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          Save Draft
        </button>
        <button
          onClick={() => submit(true)}
          disabled={saving}
          className="px-4 py-2.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-ink-950 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Submitting…" : "Submit & Investigate"}
        </button>
      </div>
    </div>
  );
}
