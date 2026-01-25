export default function StatusBadge({ active }) {
  const cls = active ? "bg-success" : "bg-secondary";
  const label = active ? "ACTIVA" : "INACTIVA";
  return <span className={`badge ${cls}`}>{label}</span>;
}
