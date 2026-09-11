import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  AlertTriangle, Layers, Zap, Network, ShieldOff, FileText, Loader2, Save,
} from "lucide-react";
import { casesApi, investigationsApi, reportsApi } from "../services/resources";
import RiskBadge from "../components/RiskBadge";
import InvestigationProgress from "../components/InvestigationProgress";
import FundFlowGraph from "../components/FundFlowGraph";
import { truncateAddr, formatDate, riskColor } from "../utils/format";

const TABS = ["Overview", "Investigation", "Fund Flow", "Evidence", "Timeline", "Notes"];

const FINDING_ICONS = {
  Layering: Layers,
  "Rapid Fund Movement": Zap,
  "Fan-Out": Network,
  "Suspicious Clustering (Fan-In)": Network,
  "High-Risk Entity Interaction": ShieldOff,
  "Exchange Interaction": FileText,
  "Dormant-to-Active": AlertTriangle,
};

export default function CaseDetail() {
  const { caseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldInvestigate = searchParams.get("investigate") === "1";

  const [caseData, setCaseData] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [running, setRunning] = useState(shouldInvestigate);
  const [tab, setTab] = useState("Overview");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [report, setReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const loadCase = useCallback(async () => {
    const res = await casesApi.get(caseId);
    setCaseData(res.data);
    return res.data;
  }, [caseId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        await loadCase();
        if (shouldInvestigate) {
          setRunning(true);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setLoadError("Case not found. It may not exist, or you do not have access to it.");
        } else if (status === 403) {
          setLoadError("Unauthorized access. You do not have permission to view this case.");
        } else {
          setLoadError("Something went wrong while loading this case. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const kickoffInvestigation = useCallback(async () => {
    const res = await investigationsApi.start(caseId);
    setInvestigation(res.data);
    setNotes(res.data.investigator_notes || "");
    const evRes = await investigationsApi.evidence(res.data.id);
    setEvidence(evRes.data);
    await loadCase();
  }, [caseId, loadCase]);

  // For pre-seeded (already-investigated) cases we don't have the investigation id
  // stored on the case; the engine is deterministic, so re-running is safe and
  // idempotent, and simply loads the same result again.
  useEffect(() => {
    if (!caseData || investigation) return;
    if (shouldInvestigate) return; // handled by progress animation flow
    if (caseData.risk_score != null) {
      investigationsApi.start(caseId).then(async (res) => {
        setInvestigation(res.data);
        setNotes(res.data.investigator_notes || "");
        const evRes = await investigationsApi.evidence(res.data.id);
        setEvidence(evRes.data);
      });
    }
  }, [caseData, investigation, caseId, shouldInvestigate]);

  const handleProgressDone = async () => {
    await kickoffInvestigation();
    setRunning(false);
    searchParams.delete("investigate");
    setSearchParams(searchParams, { replace: true });
  };

  const saveNotes = async () => {
    if (!investigation) return;
    setSavingNotes(true);
    try {
      await investigationsApi.updateNotes(investigation.id, notes);
    } finally {
      setSavingNotes(false);
    }
  };

  const generateReport = async () => {
    if (!investigation) return;
    setGeneratingReport(true);
    try {
      const res = await reportsApi.generate(investigation.id);
      setReport(res.data);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-600/60">Loading case…</p>;
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-lg border border-dashed border-slate-300 p-10 text-center max-w-lg mx-auto">
        <p className="text-sm text-ink-900 font-medium mb-1">Unable to open this case</p>
        <p className="text-sm text-ink-600/70 mb-4">{loadError}</p>
        <Link to="/cases" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
          ← Back to Cases
        </Link>
      </div>
    );
  }

  if (!caseData) return null;

  if (running) {
    return <InvestigationProgress caseNumber={caseData.case_number} onDone={handleProgressDone} />;
  }

    return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <p className="font-mono text-xs text-cyan-700 tracking-wide">{caseData.case_number}</p>
          <h1 className="text-lg font-display font-semibold text-ink-900 mt-1">{caseData.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <RiskBadge level={caseData.risk_level} size="lg" />
            {caseData.risk_score != null && (
              <span className="text-sm text-ink-600/70">{caseData.risk_score} / 100</span>
            )}
            <span className="text-xs text-ink-600/50">· {caseData.status}</span>
          </div>
        </div>
        {caseData.risk_score == null && (
          <button
            onClick={() => setRunning(true)}
            className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold"
          >
            Submit &amp; Investigate
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t ? "border-cyan-500 text-ink-900 font-medium" : "border-transparent text-ink-600/60 hover:text-ink-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
