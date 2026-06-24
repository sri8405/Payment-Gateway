type CsvValue = string | number | boolean | Date | null | undefined;

function escapeCsv(value: CsvValue) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function serializeCsv<T extends Record<string, CsvValue>>(
  rows: T[],
  columns: (keyof T)[]
) {
  const header = columns.join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCsv(row[column])).join(","))
    .join("\n");

  return [header, body].filter(Boolean).join("\n");
}
