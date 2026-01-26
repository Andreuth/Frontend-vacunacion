export function filterByQuery(items, query, fields) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) =>
    fields.some((f) => String(it?.[f] ?? "").toLowerCase().includes(q))
  );
}

export function paginate(items, page, pageSize) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * pageSize;
  return {
    page: p,
    pages,
    total,
    slice: items.slice(start, start + pageSize),
  };
}
