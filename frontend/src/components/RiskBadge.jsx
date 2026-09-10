export default function RiskBadge({ level, size = "sm" }) {
  if (!level) return <span className="text-ink-600/50 text-xs">Not assessed</span>;
  const sizeCls = size === "lg" ? "text-sm px-3 py-1.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`risk-pill risk-${level} ${sizeCls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}
