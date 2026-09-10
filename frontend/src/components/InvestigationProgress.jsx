import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Input validated",
  "Transaction discovered",
  "Source wallet identified",
  "Hop 1 traced",
  "Hop 2 traced",
  "Hop 3 traced",
  "Suspicious behaviour detected",
  "Exchange candidates identified",
  "Risk score calculated",
  "Evidence compiled",
];

export default function InvestigationProgress({ caseNumber, onDone }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= STEPS.length) {
      const t = setTimeout(onDone, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActiveStep((s) => s + 1), 260);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  return (
    <div className="max-w-lg mx-auto py-10">
      <p className="text-center font-mono text-xs text-cyan-600 tracking-wide mb-1">CASE {caseNumber}</p>
      <h2 className="text-center text-lg font-display font-semibold text-ink-900 mb-8">
        Running automated investigation…
      </h2>
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  done ? "bg-emerald-500" : active ? "bg-cyan-500" : "bg-slate-200"
                }`}
              >
                {done && <Check size={12} className="text-white" strokeWidth={3} />}
                {active && <Loader2 size={12} className="text-white animate-spin" />}
              </span>
              <span className={done || active ? "text-ink-900" : "text-ink-600/40"}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
