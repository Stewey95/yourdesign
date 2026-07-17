"use client";

import { useEffect, useRef, useState } from "react";
import {
  LOGICAL_CANVAS_HEIGHT,
  LOGICAL_CANVAS_WIDTH,
} from "./editor.constants";

type ExportFormat = "png" | "jpg" | "pdf";
type ExportQuality = "standard" | "high" | "print";
type PdfType = "standard" | "print-ready";

type ExportDialogProps = {
  open: boolean;
  onClose: () => void;
};

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  description: string;
}> = [
  {
    value: "png",
    label: "PNG",
    description: "Best for high-quality graphics and transparency.",
  },
  {
    value: "jpg",
    label: "JPG",
    description: "Smaller file size for photos and online sharing.",
  },
  {
    value: "pdf",
    label: "PDF",
    description: "Best for documents and professional printing.",
  },
];

const qualityOptions: Array<{
  value: ExportQuality;
  label: string;
  resolution: string;
  description: string;
}> = [
  {
    value: "standard",
    label: "Standard",
    resolution: "1× resolution",
    description: "Recommended for everyday online use.",
  },
  {
    value: "high",
    label: "High quality",
    resolution: "2× resolution",
    description: "Recommended for sharper digital graphics.",
  },
  {
    value: "print",
    label: "Print quality",
    resolution: "300 DPI",
    description: "Recommended for professional printing.",
  },
];

const futureOptions = [
  "Resize into multiple formats",
  "Export multiple sizes",
  "Download as ZIP",
  "Bleed and crop marks",
  "Publish directly to connected platforms",
];

export default function ExportDialog({
  open,
  onClose,
}: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [filename, setFilename] = useState("genvilo-design");
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [transparentBackground, setTransparentBackground] =
    useState(false);
  const [jpgQuality, setJpgQuality] = useState(90);
  const [pdfType, setPdfType] = useState<PdfType>("standard");
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const filenameIsValid = filename.trim().length > 0;
  const extension = format.toUpperCase();
  const selectedQuality = qualityOptions.find(
    (option) => option.value === quality
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  const closeDialog = () => {
    setExportStatus(null);
    onClose();
  };

  const selectFormat = (nextFormat: ExportFormat) => {
    setFormat(nextFormat);
    setExportStatus(null);
  };

  const requestExport = () => {
    if (!filenameIsValid) return;

    setExportStatus(
      `Export engine coming next. Your ${extension} settings are ready.`
    );
  };

  return (
    <dialog
      ref={dialogRef}
      data-editor-retain-selection
      aria-labelledby="export-dialog-title"
      aria-describedby="export-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      className="fixed bottom-0 left-0 right-0 top-auto m-0 h-[min(92dvh,780px)] max-h-[calc(100dvh-0.75rem)] w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-left text-slate-100 backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm md:inset-0 md:m-auto md:h-auto md:max-h-[calc(100dvh-2rem)] md:w-[min(760px,calc(100vw-2rem))] md:rounded-3xl"
    >
      <div
        className="flex h-full max-h-[inherit] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl md:h-auto md:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
          <div>
            <h2
              id="export-dialog-title"
              className="text-xl font-bold text-white"
            >
              Export design
            </h2>
            <p
              id="export-dialog-description"
              className="mt-1 text-sm text-slate-400"
            >
              Choose your format and download quality.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            aria-label="Close export dialog"
            title="Close"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-xl text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">
          <section aria-labelledby="export-filename-label">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                id="export-filename-label"
                htmlFor="export-filename"
                className="text-sm font-semibold text-white"
              >
                Filename
              </label>
              <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-cyan-300">
                .{format}
              </span>
            </div>
            <input
              id="export-filename"
              autoFocus
              value={filename}
              onChange={(event) => {
                setFilename(event.target.value);
                setExportStatus(null);
              }}
              aria-invalid={!filenameIsValid}
              aria-describedby={
                filenameIsValid ? undefined : "export-filename-error"
              }
              className={`w-full rounded-xl border bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
                filenameIsValid
                  ? "border-white/10 focus:border-blue-400 focus:ring-blue-500/25"
                  : "border-red-400/70 focus:border-red-400 focus:ring-red-500/20"
              }`}
            />
            {!filenameIsValid && (
              <p
                id="export-filename-error"
                className="mt-2 text-xs text-red-300"
              >
                Add a filename before exporting.
              </p>
            )}
          </section>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-white">
              File format
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {formatOptions.map((option) => {
                const selected = format === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectFormat(option.value)}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-blue-400 bg-blue-500/15 shadow-[0_0_18px_rgba(59,130,246,0.16)]"
                        : "border-white/10 bg-slate-800/70 hover:border-white/20 hover:bg-slate-800"
                    }`}
                  >
                    <span className="block text-sm font-bold text-white">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-white">
              Export quality
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {qualityOptions.map((option) => {
                const selected = quality === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setQuality(option.value);
                      setExportStatus(null);
                    }}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-purple-400 bg-purple-500/15 shadow-[0_0_18px_rgba(168,85,247,0.14)]"
                        : "border-white/10 bg-slate-800/70 hover:border-white/20 hover:bg-slate-800"
                    }`}
                  >
                    <span className="block text-sm font-bold text-white">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-purple-300">
                      {option.resolution}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            {format === "png" && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Transparent background
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Remove the canvas background for flexible placement.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={transparentBackground}
                  onClick={() => {
                    setTransparentBackground((current) => !current);
                    setExportStatus(null);
                  }}
                  className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
                    transparentBackground ? "bg-blue-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      transparentBackground
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                  <span className="sr-only">Toggle transparent background</span>
                </button>
              </div>
            )}

            {format === "jpg" && (
              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="jpg-quality"
                    className="text-sm font-semibold text-white"
                  >
                    JPG quality
                  </label>
                  <span className="text-sm font-bold text-cyan-300">
                    {jpgQuality}%
                  </span>
                </div>
                <input
                  id="jpg-quality"
                  type="range"
                  min={60}
                  max={100}
                  value={jpgQuality}
                  onChange={(event) => {
                    setJpgQuality(Number(event.target.value));
                    setExportStatus(null);
                  }}
                  className="mt-3 w-full cursor-pointer accent-blue-500"
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Higher quality keeps more detail but creates a larger file.
                </p>
              </div>
            )}

            {format === "pdf" && (
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-white">
                  PDF type
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    {
                      value: "standard" as const,
                      label: "Standard PDF",
                      description: "A balanced PDF for sharing and viewing.",
                    },
                    {
                      value: "print-ready" as const,
                      label: "Print-ready PDF",
                      description: "Prepared for professional-quality printing.",
                    },
                  ]).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={pdfType === option.value}
                      onClick={() => {
                        setPdfType(option.value);
                        setExportStatus(null);
                      }}
                      className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                        pdfType === option.value
                          ? "border-blue-400 bg-blue-500/15"
                          : "border-white/10 bg-slate-800/70 hover:border-white/20"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-white">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-white">
              Design information
            </h3>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Canvas size</dt>
                <dd className="font-semibold text-slate-200">
                  {LOGICAL_CANVAS_WIDTH} × {LOGICAL_CANVAS_HEIGHT} px
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">File type</dt>
                <dd className="font-semibold text-slate-200">.{format}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Quality</dt>
                <dd className="text-right font-semibold text-slate-200">
                  {selectedQuality?.label} · {selectedQuality?.resolution}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Estimated file size</dt>
                <dd className="text-right text-slate-300">
                  Calculated when exporting
                </dd>
              </div>
            </dl>
          </section>

          <details className="group rounded-2xl border border-dashed border-white/10 bg-slate-950/25 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-300">
              <span>More export options</span>
              <span className="rounded-full bg-purple-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-300">
                Coming later
              </span>
            </summary>
            <ul className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs text-slate-500">
              {futureOptions.map((option) => (
                <li key={option} className="flex items-center gap-2">
                  <span aria-hidden="true">○</span>
                  {option}
                </li>
              ))}
            </ul>
          </details>

          {exportStatus && (
            <p
              role="status"
              className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200"
            >
              {exportStatus}
            </p>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/10 bg-slate-900/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 md:flex md:items-center md:justify-between md:gap-4 md:px-6 md:pb-4">
          <p className="mb-3 text-xs text-slate-400 md:mb-0">
            Ready as {filename.trim() || "your-design"}.{format}
          </p>
          <div className="flex gap-2 md:shrink-0">
            <button
              type="button"
              onClick={closeDialog}
              className="flex-1 cursor-pointer rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 md:flex-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={requestExport}
              disabled={!filenameIsValid}
              className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
            >
              Export design
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
