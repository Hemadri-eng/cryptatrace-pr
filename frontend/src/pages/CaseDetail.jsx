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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-cyan-600">{caseData.case_number}</p>
          <h1 className="text-xl font-display font-semibold text-ink-900 mt-0.5">{caseData.title}</h1>
          <div className="flex items-center gap-2 mt-2">
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
            className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold"
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
              tab === t
                ? "border-cyan-500 text-ink-900 font-medium"
                : "border-transparent text-ink-600/60 hover:text-ink-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab caseData={caseData} investigation={investigation} />}

      {tab === "Investigation" && (
        investigation ? (
          <InvestigationTab
            investigation={investigation}
            report={report}
            generatingReport={generatingReport}
            onGenerateReport={generateReport}
          />
        ) : (
          <EmptyState text="This case has not been investigated yet." />
        )
      )}

      {tab === "Fund Flow" && (
        investigation ? (
          <FundFlowGraph graphData={investigation.graph_data} />
        ) : (
          <EmptyState text="No fund-flow data yet — run an investigation first." />
        )
      )}

      {tab === "Evidence" && (
        evidence.length > 0 ? (
          <EvidenceTab evidence={evidence} />
        ) : (
          <EmptyState text="No evidence recorded yet." />
        )
      )}

      {tab === "Timeline" && (
        investigation ? (
          <TimelineTab timeline={investigation.timeline} />
        ) : (
          <EmptyState text="No timeline available yet." />
        )
      )}

      {tab === "Notes" && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 max-w-2xl">
          <h2 className="text-sm font-semibold text-ink-900">Investigator Notes</h2>

          <textarea
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[160px] focus-ring focus:border-cyan-400"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record investigation notes, next steps, or liaison details…"
            disabled={!investigation}
          />

          <button
            onClick={saveNotes}
            disabled={!investigation || savingNotes}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-ink-950 hover:bg-ink-900 text-white text-sm font-medium disabled:opacity-50"
          >
            {savingNotes ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Notes
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-white rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-ink-600/50">
      {text}
    </div>
  );
}

function OverviewTab({ caseData, investigation }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-ink-900">Case Information</h2>

        <p className="text-sm text-ink-700">
          {caseData.description || "No description provided."}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
          <Field label="Incident type" value={caseData.incident_type} />
          <Field label="Fraud type" value={caseData.fraud_type} />
          <Field label="Priority" value={caseData.priority} />
          <Field label="Network" value={caseData.network} />
          <Field
            label="Amount"
            value={
              caseData.approx_amount
                ? `${caseData.approx_amount} ${caseData.currency}`
                : "—"
            }
          />
          <Field label="Created" value={formatDate(caseData.created_at)} />
        </div>

        {caseData.victim_notes && (
          <div className="pt-2">
            <p className="text-xs text-ink-600/50 mb-1">Victim notes</p>
            <p className="text-sm text-ink-700 bg-slate-50 rounded-md p-3">
              {caseData.victim_notes}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">
          Reported Wallet / Tx
        </h2>

        <p className="font-mono text-xs text-ink-700 bg-slate-50 rounded-md p-3 break-all">
          {caseData.reported_wallet_or_tx || "—"}
        </p>

        {investigation && (
          <>
            <h2 className="text-sm font-semibold text-ink-900 pt-2">
              Probable Destination
            </h2>

            <p className="text-sm text-ink-900 font-medium">
              {investigation.probable_entity_name}
            </p>

            <p className="text-xs text-ink-600/70">
              Confidence: {investigation.probable_entity_confidence}%
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-600/50">{label}</p>
      <p className="text-ink-900">{value}</p>
    </div>
  );
}

function InvestigationTab({
  investigation,
  report,
  generatingReport,
  onGenerateReport,
}) {
  return (
    <div className="space-y-5">
      <div className="bg-ink-950 rounded-lg p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Overall Risk Score
            </p>

            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-display font-bold"
                style={{
                  color: riskColor(investigation.risk_level),
                }}
              >
                {investigation.risk_score}
              </span>

              <span className="text-slate-400 text-sm">
                / 100
              </span>
            </div>
          </div>

          <RiskBadge level={investigation.risk_level} size="lg" />

          <button
            onClick={onGenerateReport}
            disabled={generatingReport}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold px-4 py-2.5 rounded-md disabled:opacity-60"
          >
            {generatingReport ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileText size={15} />
            )}
            Generate Report
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm">
          Report{" "}
          <span className="font-mono">
            {report.report_number}
          </span>{" "}
          generated.

          <button
            onClick={() => openReport(report)}
            className="text-emerald-700 font-medium ml-1 hover:underline"
          >
            View report →
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-2">
          Executive Summary
        </h2>

        <p className="text-sm text-ink-700 leading-relaxed">
          {investigation.executive_summary}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-4">
          Risk Score Breakdown
        </h2>

        <div className="space-y-3">
          {investigation.risk_factors.map((f, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-ink-900">
                  {f.label}
                </span>

                <span className="font-mono text-cyan-600">
                  +{f.weight}
                </span>
              </div>

              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{
                    width: `${(f.weight / 20) * 100}%`,
                  }}
                />
              </div>

              <p className="text-xs text-ink-600/60 mt-1">
                {f.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink-900 mb-3">
          Key Findings
        </h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {investigation.findings.map((f, i) => {
            const Icon =
              FINDING_ICONS[f.title] || AlertTriangle;

            const sevColor = {
              low: "text-emerald-600",
              medium: "text-amber-600",
              high: "text-orange-600",
              critical: "text-red-600",
            }[f.severity] || "text-ink-600";

            return (
              <div
                key={i}
                className="bg-white rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={16} className={sevColor} />

                  <h3 className="text-sm font-semibold text-ink-900">
                    {f.title}
                  </h3>
                </div>

                <p className="text-xs text-ink-600/70 mb-2">
                  {f.description}
                </p>

                <span className="text-xs font-mono text-cyan-600">
                  Risk contribution: +{f.risk_contribution}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-2">
          Probable Exchange
        </h2>

        <p className="text-sm font-medium text-ink-900">
          {investigation.probable_entity_name}
        </p>

        <p className="text-xs text-ink-600/70 mt-0.5 mb-2">
          Confidence: {investigation.probable_entity_confidence}%
        </p>

        <p className="text-sm text-ink-700">
          {investigation.probable_entity_reasoning}
        </p>
      </div>
    </div>
  );
}

function openReport(report) {
  const w = window.open("", "_blank");

  if (w) {
    w.document.write(report.html_content);
    w.document.close();
  }
}

function EvidenceTab({ evidence }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-xs text-ink-600/60 border-b border-slate-200 bg-slate-50">
              <th className="font-medium px-4 py-2.5">
                Evidence ID
              </th>

              <th className="font-medium px-3 py-2.5">
                Tx Hash
              </th>

              <th className="font-medium px-3 py-2.5">
                Source → Destination
              </th>

              <th className="font-medium px-3 py-2.5">
                Amount
              </th>

              <th className="font-medium px-3 py-2.5">
                Timestamp
              </th>

              <th className="font-medium px-3 py-2.5">
                Finding
              </th>

              <th className="font-medium px-4 py-2.5"></th>
            </tr>
          </thead>

          <tbody>
            {evidence.map((e) => (
              <tr
                key={e.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-ink-900">
                  {e.evidence_code}
                </td>

                <td className="px-3 py-2.5 font-mono text-xs text-cyan-700">
                  {truncateAddr(e.transaction_hash, 10)}
                </td>

                <td className="px-3 py-2.5 font-mono text-xs text-ink-600/80">
                  {truncateAddr(e.source_wallet, 6)} →{" "}
                  {truncateAddr(e.destination_wallet, 6)}
                </td>

                <td className="px-3 py-2.5 text-xs">
                  {e.amount} {e.token}
                </td>

                <td className="px-3 py-2.5 text-xs text-ink-600/60">
                  {formatDate(e.timestamp)}
                </td>

                <td className="px-3 py-2.5 text-xs">
                  {e.finding_supported}
                </td>

                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => setSelected(e)}
                    className="text-cyan-600 hover:text-cyan-700 text-xs font-medium"
                  >
                    View transaction →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-900">
                Transaction Detail — {selected.evidence_code}
              </h3>

              <button
                onClick={() => setSelected(null)}
                className="text-ink-600/50 hover:text-ink-900 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-[11px] text-ink-600/50 bg-slate-50 rounded px-3 py-2 font-mono break-all">
              {selected.transaction_hash}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <ModalRow
                label="Blockchain"
                value={selected.blockchain}
              />

              <ModalRow
                label="Amount"
                value={`${selected.amount} ${selected.token}`}
              />

              <ModalRow
                label="Timestamp"
                value={formatDate(selected.timestamp)}
              />

              <ModalRow
                label="Finding supported"
                value={selected.finding_supported}
              />
            </div>

            <div>
              <p className="text-xs text-ink-600/50 mb-1">
                Source wallet
              </p>

              <p className="text-xs font-mono break-all text-ink-800">
                {selected.source_wallet}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink-600/50 mb-1">
                Destination wallet
              </p>

              <p className="text-xs font-mono break-all text-ink-800">
                {selected.destination_wallet}
              </p>
            </div>

            <p className="text-[11px] text-ink-600/40 pt-1 border-t border-slate-100">
              Simulated transaction record for demonstration purposes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-600/50">
        {label}
      </p>

      <p className="text-ink-900">
        {value}
      </p>
    </div>
  );
}

function TimelineTab({ timeline }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <ol className="relative border-l border-slate-200 ml-2 space-y-6">
        {timeline.map((t, i) => (
          <li key={i} className="ml-4">
            <div className="absolute w-2 h-2 bg-cyan-500 rounded-full -left-[4.5px] mt-1.5" />

            <p className="text-xs text-ink-600/60">
              {formatDate(t.timestamp)}
            </p>

            <p className="text-sm text-ink-900 font-medium">
              {t.event}
            </p>

            <p className="text-xs text-ink-600/70">
              {t.detail}
            </p>

            {t.tx_hash && (
              <p className="text-[11px] font-mono text-cyan-600 mt-0.5">
                {truncateAddr(t.tx_hash, 12)}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
