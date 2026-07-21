"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ExportCanvasDimensions,
  DesignExportConfig,
  ExportFormat,
  ExportQualityPreset,
  PdfExportType,
} from "../../types/export";
import {
  getExportScale,
  getScaledExportDimensions,
} from "../../lib/export/exportDimensions";
import { CANVAS_PRESETS } from "./editor.constants";
import { isMobileSafari } from "../../lib/export/isMobileSafari";
import type {
  ExportDeliveryOptions,
  PreparedExportDelivery,
} from "../../lib/export/exportDesign";

type ExportDialogProps = {
  open: boolean;
  onClose: () => void;
  onExport: (
    config: DesignExportConfig,
    options?: ExportDeliveryOptions
  ) => Promise<boolean>;
  canvasSize: Pick<ExportCanvasDimensions, "width" | "height">;
};

type ExportStatus = {
  kind: "progress" | "success" | "error" | "info";
  message: string;
};

type ExportDeliveryNotice = {
  title: string;
  message: string;
  actions: string[];
};

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  description: string;
}> = [
  {
    value: "png",
    label: "PNG",
    description: "Sharp graphics with optional transparency.",
  },
  {
    value: "jpg",
    label: "JPG",
    description: "Compact files for photos and online sharing.",
  },
  {
    value: "pdf",
    label: "PDF",
    description: "A versatile document for sharing and printing.",
  },
];

const qualityOptions: Array<{
  value: ExportQualityPreset;
  label: string;
  resolution: string;
  description: string;
}> = [
  {
    value: "standard",
    label: "Standard",
    resolution: "Original size",
    description: "Ideal for quick sharing and everyday use.",
  },
  {
    value: "high",
    label: "High",
    resolution: "3× larger",
    description: "Extra detail for websites and digital products.",
  },
  {
    value: "print",
    label: "Print",
    resolution: "10× larger",
    description: "Maximum detail for large, high-quality output.",
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
  onExport,
  canvasSize,
}: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const preparedDeliveryRef = useRef<PreparedExportDelivery | null>(null);
  const [filename, setFilename] = useState("genvilo-design");
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<ExportQualityPreset>("high");
  const [transparentBackground, setTransparentBackground] =
    useState(false);
  const [jpgQuality, setJpgQuality] = useState(90);
  const [pdfType, setPdfType] = useState<PdfExportType>("standard");
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);
  const [deliveryNotice, setDeliveryNotice] =
    useState<ExportDeliveryNotice | null>(null);

  const filenameIsValid = filename.trim().length > 0;
  const extension = format.toUpperCase();
  const selectedQuality = qualityOptions.find(
    (option) => option.value === quality
  );
  const exportScale = getExportScale(quality);
  const exportDimensions = getScaledExportDimensions(
    {
      width: canvasSize.width,
      height: canvasSize.height,
    },
    exportScale
  );
  const canvasPresetName =
    CANVAS_PRESETS.find(
      (preset) =>
        preset.width === canvasSize.width &&
        preset.height === canvasSize.height
    )?.label ?? "Custom";

  const finishPreparedDelivery = (
    action: "continueDownload" | "cancelDownload"
  ) => {
    const delivery = preparedDeliveryRef.current;

    preparedDeliveryRef.current = null;
    setDeliveryNotice(null);
    delivery?.[action]();
  };

  useEffect(
    () => () => {
      preparedDeliveryRef.current?.cancelDownload();
      preparedDeliveryRef.current = null;
    },
    []
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
    preparedDeliveryRef.current?.cancelDownload();
    preparedDeliveryRef.current = null;
    setExportStatus(null);
    setDeliveryNotice(null);
    onClose();
  };

  const selectFormat = (nextFormat: ExportFormat) => {
    setFormat(nextFormat);
    setExportStatus(null);
    setDeliveryNotice(null);
  };

  const requestExport = async () => {
    if (!filenameIsValid || isExporting) return;

    setIsExporting(true);
    setDeliveryNotice(null);
    setExportStatus({
      kind: "progress",
      message: `Preparing ${extension} export…`,
    });

    try {
      const baseConfig = {
        filename,
        qualityPreset: quality,
        scale: exportScale,
        canvas: {
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: "#ffffff",
        },
      };
      const config: DesignExportConfig =
        format === "png"
          ? {
              ...baseConfig,
              format: "png",
              transparentBackground,
            }
          : format === "jpg"
            ? {
                ...baseConfig,
                format: "jpg",
                transparentBackground: false,
                quality: jpgQuality / 100,
              }
            : {
                ...baseConfig,
                format: "pdf",
                transparentBackground: false,
                pdfType,
              };

      const usesSafariPdfPreview =
        config.format === "pdf" && isMobileSafari();

      const delivered = await onExport(
        config,
        usesSafariPdfPreview
          ? {
              onDownloadReady: (delivery) => {
                preparedDeliveryRef.current = delivery;
                setDeliveryNotice({
                  title: "✓ Your PDF is ready",
                  message: "Safari opens PDFs in Preview.",
                  actions: [
                    "Save to Files",
                    "AirDrop",
                    "Print",
                    "Share with another app",
                  ],
                });
                setExportStatus(null);
              },
            }
          : undefined
      );

      if (delivered && !usesSafariPdfPreview) {
        setExportStatus({
          kind: "success",
          message: `${extension} export complete`,
        });
      }
    } catch (error) {
      console.error("Export failed", error);
      setExportStatus({
        kind: "error",
        message:
          error instanceof Error
            ? `Export failed: ${error.message}`
            : "Export failed. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
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
        className="relative flex h-full max-h-[inherit] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl md:h-auto md:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
          <div>
            <h2
              id="export-dialog-title"
              className="text-xl font-bold text-white"
            >
              Download your design
            </h2>
            <p
              id="export-dialog-description"
              className="mt-1 text-sm text-slate-400"
            >
              Choose a file type and output quality.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            aria-label="Close export dialog"
            title="Close"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-xl text-slate-300 transition hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 md:px-6 md:py-6">
          <section aria-labelledby="export-filename-label">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                id="export-filename-label"
                htmlFor="export-filename"
                className="text-sm font-semibold text-white"
              >
                File name
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
              File type
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
                    className={`cursor-pointer rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
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
                    className={`cursor-pointer rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
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
                    Export without the white canvas background.
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
                  className={`relative h-6 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    transparentBackground ? "bg-blue-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      transparentBackground
                        ? "translate-x-5"
                        : "translate-x-0"
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
                      className={`cursor-pointer rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
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

          <section className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 md:p-5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Export summary
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Review your design and download settings.
              </p>
            </div>
            <dl className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Canvas
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-white">
                  {canvasPresetName}
                </dd>
                <p className="mt-0.5 text-xs tabular-nums text-slate-400">
                  Design size · {canvasSize.width} × {canvasSize.height} px
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Export quality
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-white">
                  {selectedQuality?.label}
                </dd>
                <p className="mt-0.5 text-xs text-slate-400">
                  {selectedQuality?.resolution}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Output resolution
                </dt>
                <dd className="mt-1.5 text-sm font-semibold tabular-nums text-white">
                  {exportDimensions.width} × {exportDimensions.height} px
                </dd>
                <p className="mt-0.5 text-xs text-slate-400">
                  Final downloaded dimensions
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  File type
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-white">
                  {extension}
                </dd>
                <p className="mt-0.5 text-xs text-slate-400">
                  {format === "png"
                    ? "High-quality image"
                    : format === "jpg"
                      ? "Compressed image"
                      : "Portable document"}
                </p>
              </div>
            </dl>
          </section>

          <details className="group rounded-2xl border border-dashed border-white/10 bg-slate-950/25 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-semibold text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
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

        </div>

        {deliveryNotice && (
          <section
            aria-labelledby="export-delivery-title"
            aria-modal="true"
            role="dialog"
            className="absolute inset-0 z-[80] flex items-end bg-slate-950/70 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-sm md:hidden"
          >
            <div className="w-full rounded-3xl border border-emerald-400/20 bg-slate-900 p-5 text-emerald-50 shadow-2xl shadow-slate-950/50">
              <h3
                id="export-delivery-title"
                className="text-lg font-bold text-white"
              >
                {deliveryNotice.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                {deliveryNotice.message}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">
                From there you can
              </p>
              <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-sm font-medium text-slate-200">
                {deliveryNotice.actions.map((action) => (
                  <li key={action} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300"
                    />
                    {action}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    finishPreparedDelivery("cancelDownload")
                  }
                  className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() =>
                    finishPreparedDelivery("continueDownload")
                  }
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:from-emerald-400 hover:to-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Continue
                </button>
              </div>
            </div>
          </section>
        )}

        {exportStatus && (
          <div className="shrink-0 border-t border-white/10 bg-slate-900/95 px-5 pt-3 md:px-6">
            <p
              role={exportStatus.kind === "error" ? "alert" : "status"}
              aria-live="polite"
              className={`rounded-xl border px-3 py-2 text-sm ${
                exportStatus.kind === "error"
                  ? "border-red-400/20 bg-red-500/10 text-red-200"
                  : exportStatus.kind === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    : "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
              }`}
            >
              {exportStatus.message}
            </p>
          </div>
        )}

        <footer
          className={`shrink-0 bg-slate-900/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 md:flex md:items-center md:justify-between md:gap-4 md:px-6 md:pb-4 ${
            exportStatus ? "" : "border-t border-white/10"
          }`}
        >
          <p className="mb-3 text-xs text-slate-400 md:mb-0">
            Ready as {filename.trim() || "your-design"}.{format}
          </p>
          <div className="flex gap-2 md:shrink-0">
            <button
              type="button"
              onClick={closeDialog}
              className="flex-1 cursor-pointer rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:flex-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={requestExport}
              disabled={!filenameIsValid || isExporting}
              aria-busy={isExporting}
              className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
            >
              {isExporting ? "Preparing export…" : `Download ${extension}`}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
