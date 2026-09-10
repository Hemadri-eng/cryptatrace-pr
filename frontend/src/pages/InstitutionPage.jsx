import { useEffect, useState } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { institutionsApi } from "../services/resources";
import { useAuth } from "../context/AuthContext";

export default function InstitutionPage() {
  const { institution } = useAuth();
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    institutionsApi.list().then((res) => setInstitutions(res.data));
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Institution</h1>
        <p className="text-sm text-ink-600/70 mt-0.5">
          Your organization's profile on the CRYPTATRACE platform.
        </p>
      </div>

      {institutions.map((inst) => (
        <div key={inst.id} className="bg-white rounded-lg border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-cyan-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink-900">{inst.name}</h2>
            <p className="text-xs text-ink-600/60 mt-0.5">Code: {inst.code} · {inst.institution_type}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${inst.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
              {inst.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      ))}

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 flex gap-3">
        <ShieldCheck size={18} className="text-cyan-700 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-900 leading-relaxed">
          Case data, evidence, and reports are strictly isolated per institution. No other
          institution on the CRYPTATRACE platform — including other law enforcement units and
          financial intelligence units — can view or query your institution's records.
        </p>
      </div>
    </div>
  );
}
