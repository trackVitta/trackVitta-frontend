export type ImportFieldType = "TEXT" | "DATE" | "PLAN" | "STATUS" | "NUMBER";

export interface ImportField {
  key: string;
  label: string;
  required: boolean;
  type: ImportFieldType;
  allowsDefault: boolean;
  allowedValues: string[];
}

export interface ImportColumn {
  index: number;
  name: string;
  samples: string[];
}

export interface ImportAnalyzeResponse {
  fileName: string;
  fileType: string;
  totalRows: number;
  columns: ImportColumn[];
  fields: ImportField[];
  suggestedMapping: Record<string, number>;
}

export interface ImportRowError {
  rowNumber: number;
  fullName: string | null;
  reason: string;
  missingFields: string[] | null;
}

export interface ImportPreviewRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  mappedFields: ImportField[];
  sampleRows: ImportPreviewRow[];
  errors: ImportRowError[];
  errorsTruncated: boolean;
  canImport: boolean;
}

export interface ImportResult {
  totalRows: number;
  successImport: number;
  failedImport: number;
  duplicateSkipped: number;
  failedRowsNumbers: number[];
  rowErrors: ImportRowError[];
  errorsTruncated: boolean;
}

/** columns: member field key -> index of the file column (null = not in the file).
 *  defaults: member field key -> one value applied to every member (plan / status only). */
export interface ImportMapping {
  columns: Record<string, number | null>;
  defaults: Record<string, string>;
}
