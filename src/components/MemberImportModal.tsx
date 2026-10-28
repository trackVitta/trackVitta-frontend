import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { getApiError } from "../api/client";
import { analyzeImport, commitImport, previewImport } from "../api/memberApi";
import type {
  ImportAnalyzeResponse,
  ImportMapping,
  ImportPreviewResponse,
  ImportResult,
  ImportRowError,
} from "../types/import";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

type Step = "upload" | "mapping" | "preview" | "done";

interface MemberImportModalProps {
  businessId: string;
  businessName: string;
  onClose: () => void;
  onImported: () => void;
}

const stepTitles: Record<Step, string> = {
  upload: "Upload your file",
  mapping: "Match your columns",
  preview: "Check before importing",
  done: "Import finished",
};

const stepOrder: Step[] = ["upload", "mapping", "preview", "done"];

const prettyValue = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());

function ErrorList({ title, errors, truncated }: {
  title: string;
  errors: ImportRowError[];
  truncated: boolean;
}) {
  if (errors.length === 0) return null;

  return (
    <div className="import-errors">
      <h3>{title}</h3>
      <ul>
        {errors.map((error) => (
          <li key={error.rowNumber}>
            <strong>Row {error.rowNumber}</strong>
            {error.fullName ? ` · ${error.fullName}` : ""} — {error.reason}
          </li>
        ))}
      </ul>
      {truncated && <p>Showing the first {errors.length} only.</p>}
    </div>
  );
}

export function MemberImportModal({
  businessId,
  businessName,
  onClose,
  onImported,
}: MemberImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalyzeResponse | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({ columns: {}, defaults: {} });
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // which field currently owns each file column (a column can feed only one field)
  const columnOwner = useMemo(() => {
    const owners = new Map<number, string>();
    for (const [fieldKey, columnIndex] of Object.entries(mapping.columns)) {
      if (columnIndex !== null && columnIndex !== undefined) owners.set(columnIndex, fieldKey);
    }
    return owners;
  }, [mapping.columns]);

  const mappingProblem = useMemo(() => {
    if (mapping.columns.fullName == null) {
      return "Choose which column holds the member's full name.";
    }
    if (mapping.columns.membershipPlan == null && !mapping.defaults.membershipPlan) {
      return "Choose a plan column, or one plan to apply to every member.";
    }
    if (mapping.columns.membership_fee == null && !mapping.defaults.membership_fee) {
      return "Choose a fee column, or enter one fee to apply to every member.";
    }
    return "";
  }, [mapping]);

  const close = () => {
    if (busy) return;
    if (result) onImported();
    onClose();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;

    setError("");
    setBusy(true);
    try {
      const data = await analyzeImport(businessId, selected);
      const columns: Record<string, number | null> = {};
      for (const field of data.fields) {
        columns[field.key] = data.suggestedMapping[field.key] ?? null;
      }
      setFile(selected);
      setAnalysis(data);
      setMapping({ columns, defaults: {} });
      setPreview(null);
      setStep("mapping");
    } catch (requestError) {
      setError(getApiError(requestError, "We could not read this file."));
    } finally {
      setBusy(false);
    }
  };

  const setColumn = (fieldKey: string, value: string) => {
    setMapping((current) => ({
      ...current,
      columns: { ...current.columns, [fieldKey]: value === "" ? null : Number(value) },
    }));
  };

  const setDefault = (fieldKey: string, value: string) => {
    setMapping((current) => ({
      ...current,
      defaults: { ...current.defaults, [fieldKey]: value },
    }));
  };

  const runPreview = async () => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      setPreview(await previewImport(businessId, file, mapping));
      setStep("preview");
    } catch (requestError) {
      setError(getApiError(requestError, "We could not check this mapping."));
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      setResult(await commitImport(businessId, file, mapping));
      setStep("done");
    } catch (requestError) {
      setError(getApiError(requestError, "The import failed. Nothing was saved."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      wide
      title={stepTitles[step]}
      description={`Add many members to ${businessName} at once from an Excel (.xlsx) or CSV file.`}
      onClose={close}
    >
      <div className="modal-form">
        <ol className="import-steps">
          {stepOrder.map((item, index) => (
            <li
              key={item}
              className={item === step ? "import-step-active" : index < stepOrder.indexOf(step) ? "import-step-done" : ""}
            >
              <span>{index + 1}</span>
              {stepTitles[item]}
            </li>
          ))}
        </ol>

        {error && <div className="notice notice-error">{error}</div>}

        {step === "upload" && (
          <>
            <button
              className="import-drop"
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <Icon name="upload" />
              <strong>{busy ? "Reading your file..." : "Choose an Excel or CSV file"}</strong>
              <span>.xlsx or .csv · up to 5 MB · up to 5,000 members</span>
            </button>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFile}
            />
            <p className="import-hint">
              Put column names in the first row. For Excel files, only the first sheet is read. Make sure
              phone numbers are not shown like 9.87E+11 — format that column as Text.
            </p>
          </>
        )}

        {step === "mapping" && analysis && (
          <>
            <p className="import-hint">
              <strong>{analysis.fileName}</strong> · {analysis.totalRows} rows · {analysis.columns.length} columns.
              We matched what we could — check each one and fix anything that looks wrong.
            </p>

            <div className="import-map">
              {analysis.fields.map((field) => {
                const selected = mapping.columns[field.key];
                const column = selected == null ? null : analysis.columns[selected];

                return (
                  <div className="import-map-row" key={field.key}>
                    <div className="import-map-target">
                      <strong>{field.label}</strong>
                      {field.required && <span className="import-badge">Required</span>}
                    </div>

                    <div className="import-map-source">
                      <select
                        aria-label={`Column for ${field.label}`}
                        value={selected ?? ""}
                        onChange={(event) => setColumn(field.key, event.target.value)}
                      >
                        <option value="">Not in my file</option>
                        {analysis.columns.map((item) => {
                          const owner = columnOwner.get(item.index);
                          return (
                            <option
                              key={item.index}
                              value={item.index}
                              disabled={owner !== undefined && owner !== field.key}
                            >
                              {item.name}
                            </option>
                          );
                        })}
                      </select>

                      {column && column.samples.length > 0 && (
                        <small>e.g. {column.samples.join(" · ")}</small>
                      )}

                      {selected == null && field.allowsDefault && (
                        <label className="import-default">
                          <span>Or use one value for everyone</span>
                          {field.type === "NUMBER" ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              placeholder="e.g. 1500"
                              value={mapping.defaults[field.key] ?? ""}
                              onChange={(event) => setDefault(field.key, event.target.value)}
                            />
                          ) : (
                            <select
                              value={mapping.defaults[field.key] ?? ""}
                              onChange={(event) => setDefault(field.key, event.target.value)}
                            >
                              <option value="">
                                {field.required ? "Choose..." : "Active (default)"}
                              </option>
                              {field.allowedValues.map((value) => (
                                <option key={value} value={value}>{prettyValue(value)}</option>
                              ))}
                            </select>
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {mappingProblem && <div className="notice notice-error">{mappingProblem}</div>}

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setStep("upload")}>
                <Icon name="arrow-left" />
                Different file
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={busy || Boolean(mappingProblem)}
                onClick={runPreview}
              >
                {busy ? "Checking..." : "Preview import"}
                {!busy && <Icon name="arrow-right" />}
              </button>
            </div>
          </>
        )}

        {step === "preview" && preview && (
          <>
            <div className="import-stats">
              <div><strong>{preview.totalRows}</strong><span>rows read</span></div>
              <div className="import-stat-good"><strong>{preview.validRows}</strong><span>ready to import</span></div>
              <div className={preview.invalidRows > 0 ? "import-stat-warn" : ""}>
                <strong>{preview.invalidRows}</strong><span>have problems</span>
              </div>
              <div className={preview.duplicateRows > 0 ? "import-stat-warn" : ""}>
                <strong>{preview.duplicateRows}</strong><span>already exist</span>
              </div>
            </div>

            {preview.sampleRows.length > 0 ? (
              <>
                <p className="import-hint">
                  {preview.sampleRows.length} random members from your file, exactly as they will be saved:
                </p>
                <div className="import-sample-wrap">
                  <table className="import-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        {preview.mappedFields.map((field) => <th key={field.key}>{field.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleRows.map((row) => (
                        <tr key={row.rowNumber}>
                          <td>{row.rowNumber}</td>
                          {preview.mappedFields.map((field) => (
                            <td key={field.key}>{row.values[field.key] || "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="notice notice-error">
                No row in this file can be imported with this mapping. Go back and check the columns.
              </div>
            )}

            <ErrorList
              title="These rows will be skipped"
              errors={preview.errors}
              truncated={preview.errorsTruncated}
            />
            {(preview.invalidRows > 0 || preview.duplicateRows > 0) && (
              <p className="import-hint">
                Skipped rows are not lost: fix them in your file and import it again. Members that were
                already imported are recognised and skipped, so nothing is added twice.
              </p>
            )}

            <div className="modal-actions">
              <button className="secondary-button" type="button" disabled={busy} onClick={() => setStep("mapping")}>
                <Icon name="arrow-left" />
                Change mapping
              </button>
              <button className="secondary-button" type="button" disabled={busy} onClick={runPreview}>
                Show other examples
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={busy || !preview.canImport}
                onClick={runImport}
              >
                {busy ? "Importing..." : `OK, import ${preview.validRows} members`}
                {!busy && <Icon name="check" />}
              </button>
            </div>
          </>
        )}

        {step === "done" && result && (
          <>
            <div className="notice notice-success">
              <span><Icon name="check" /></span>
              {result.successImport} of {result.totalRows} members were added to {businessName}.
            </div>

            {result.failedImport > 0 && (
              <p className="import-hint">
                {result.failedImport} rows were skipped
                {result.duplicateSkipped > 0 ? ` (${result.duplicateSkipped} already existed)` : ""}.
              </p>
            )}
            <ErrorList
              title="Skipped rows"
              errors={result.rowErrors}
              truncated={result.errorsTruncated}
            />

            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={close}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
