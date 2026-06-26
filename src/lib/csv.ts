/**
 * Client-side CSV export. Turns an array of rows into a downloaded .csv file —
 * no backend round-trip. Values are RFC-4180 escaped (quotes, commas, newlines).
 */
export interface CsvColumn<T> {
  key: keyof T & string;
  header: string;
}

function escape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv<T extends object>(
  filename: string,
  rows: readonly T[],
  columns: CsvColumn<T>[],
): void {
  const head = columns.map((c) => escape(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => escape(r[c.key])).join(',')).join('\n');
  const csv = `${head}\n${body}`;

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
