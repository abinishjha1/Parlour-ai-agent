/**
 * Converts an array of objects to a CSV string.
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return "";

  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        if (val instanceof Date) return `"${val.toISOString()}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Creates a downloadable CSV response.
 */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
