import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { casesApi, investigationsApi } from "../services/resources";
import { useNavigate } from "react-router-dom";

export default function Intelligence() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const lookup = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setError("");
    setLoading(true);
    try {
      // Quick-lookup creates a lightweight case behind the scenes so the
      // full graph/risk/evidence pipeline can run through the normal flow.
      const res = await casesApi.create({
        title: `Ad-hoc intelligence lookup — ${address.slice(0, 10)}...`,
        description: "Created via Blockchain Intelligence quick lookup.",
        incident_type: "Intelligence Lookup",
        fraud_type: "Other",
        input_type: "wallet",
        wallet_address: address.trim(),
        network: "Ethereum",
        currency: "ETH",
        priority: "Medium",
        submit_now: true,
      });
      navigate(`/cases/${res.data.id}?investigate=1`);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not run lookup on that address.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Blockchain Intelligence</h1>
        <p className="text-sm text-ink-600/70 mt-0.5">
          Run a quick automated trace on a wallet address without filing a full victim report.
          A case record is still created so the trace stays auditable.
        </p>
      </div>

      <form onSubmit={lookup} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
        <label className="block text-xs font-medium text-ink-600/80">Wallet address</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/40" />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-2.5 text-sm font-mono focus-ring focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-md"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Trace
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-ink-600/50 pt-1">
          Try the demo wallet: <button type="button" onClick={() => setAddress("0xDEMO0LOOKUP00000000000000000000000001")} className="font-mono text-cyan-600 hover:underline">0xDEMO0LOOKUP...0001</button>
        </p>
      </form>
    </div>
  );
}
