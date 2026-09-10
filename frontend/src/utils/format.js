export function truncateAddr(addr, chars = 8) {
  if (!addr) return "—";
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-4)}`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function riskColor(level) {
  switch (level) {
    case "LOW": return "#2f9e5b";
    case "MEDIUM": return "#c98a1f";
    case "HIGH": return "#d5651f";
    case "CRITICAL": return "#c73438";
    default: return "#64748b";
  }
}
