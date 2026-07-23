"use client";

import {
  fontOptions,
  TEXT_MAX_FONT_SIZE,
  TEXT_MIN_FONT_SIZE,
  TEXT_FONT_SIZE_STEP,
} from "./editor.constants";
import type {
  DesignItem,
  ImageAdjustment,
} from "./editor.types";
import LayersPanel from "./LayersPanel";
import PropertyStepper from "./PropertyStepper";
import {
  DEFAULT_SHAPE_COLOUR,
  MAX_SHAPE_STROKE_WIDTH,
  MIN_SHAPE_STROKE_WIDTH,
  isStrokeOnlyShape,
} from "./shape.constants";

type EditorInspectorProps = {
  items: DesignItem[];
  item: DesignItem | undefined;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onToggleLayerVisibility: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onChangeTextFontSize: (id: string, fontSize: number) => void;
  onChangeTextColor: (id: string, color: string) => void;
  onChangeTextFont: (id: string, fontFamily: string) => void;
  onRotate: (id: string, amount: number) => void;
  onChangeShapeFill: (id: string, fill: string | null) => void;
  onChangeShapeStroke: (id: string, stroke: string | null) => void;
  onChangeShapeStrokeWidth: (id: string, strokeWidth: number) => void;
  onAdjustmentStart: () => void;
  onAdjustmentEnd: () => void;
  onResetImageAdjustments: (id: string) => void;
  onAdjustmentChange: (
    id: string,
    adjustment: ImageAdjustment,
    value: number
  ) => void;
};

export default function EditorInspector({
  items,
  item,
  selectedItemId,
  onSelectItem,
  onReorderLayers,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onChangeTextFontSize,
  onChangeTextColor,
  onChangeTextFont,
  onRotate,
  onChangeShapeFill,
  onChangeShapeStroke,
  onChangeShapeStrokeWidth,
  onAdjustmentStart,
  onAdjustmentEnd,
  onResetImageAdjustments,
  onAdjustmentChange,
}: EditorInspectorProps) {
  return (
    <aside
      data-editor-retain-selection
      className="hidden h-full min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-sm text-slate-300 shadow-xl md:block"
    >
      <LayersPanel
        items={items}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        onReorderLayers={onReorderLayers}
        onToggleVisibility={onToggleLayerVisibility}
        onToggleLock={onToggleLayerLock}
      />

      <div className="my-4 border-t border-white/10" />

      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-cyan-400">
        Properties
      </p>

      {!item && (
        <p className="rounded-xl border border-white/10 bg-slate-800/60 p-3 text-sm text-slate-400">
          Select an item to edit
        </p>
      )}

      {item?.locked && (
        <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
          <p className="text-sm font-bold text-white">
            🔒 This object is locked.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Unlock to edit this object.
          </p>
          <button
            type="button"
            onClick={() => onToggleLayerLock(item.id)}
            className="mt-3 h-9 w-full rounded-lg bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Unlock
          </button>
        </div>
      )}

      {item?.type === "text" && !item.locked && (
        <div className="space-y-4">
          <InspectorField label="Font">
            <select
              value={item.fontFamily}
              onChange={(event) =>
                onChangeTextFont(item.id, event.target.value)
              }
              className="h-9 w-full rounded-lg border border-white/10 bg-slate-800 px-2 text-sm font-semibold text-white outline-none"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </InspectorField>

          <InspectorField label="Size">
            <PropertyStepper
              key={item.id}
              label="Font size"
              value={item.fontSize}
              min={TEXT_MIN_FONT_SIZE}
              max={TEXT_MAX_FONT_SIZE}
              step={TEXT_FONT_SIZE_STEP}
              keyboardStep={1}
              largeStep={10}
              suffix="px"
              decrementLabel="A−"
              incrementLabel="A+"
              onCommit={(fontSize) =>
                onChangeTextFontSize(item.id, fontSize)
              }
              onEditStart={onAdjustmentStart}
              onEditEnd={onAdjustmentEnd}
            />
          </InspectorField>

          <InspectorField label="Colour">
            <input
              type="color"
              value={item.color}
              onChange={(event) =>
                onChangeTextColor(item.id, event.target.value)
              }
              className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-slate-800 p-1"
              aria-label="Text colour"
            />
          </InspectorField>

          <RotationControls
            itemId={item.id}
            onRotate={onRotate}
          />
        </div>
      )}

      {item?.type === "image" && !item.locked && (
        <div className="space-y-4">
          <InspectorSlider
            label="Brightness"
            value={item.brightness}
            max={200}
            onStart={onAdjustmentStart}
            onEnd={onAdjustmentEnd}
            onChange={(value) =>
              onAdjustmentChange(item.id, "brightness", value)
            }
          />
          <InspectorSlider
            label="Contrast"
            value={item.contrast}
            max={200}
            onStart={onAdjustmentStart}
            onEnd={onAdjustmentEnd}
            onChange={(value) =>
              onAdjustmentChange(item.id, "contrast", value)
            }
          />
          <InspectorSlider
            label="Saturation"
            value={item.saturation}
            max={200}
            onStart={onAdjustmentStart}
            onEnd={onAdjustmentEnd}
            onChange={(value) =>
              onAdjustmentChange(item.id, "saturation", value)
            }
          />
          <InspectorSlider
            label="Opacity"
            value={item.opacity}
            max={100}
            onStart={onAdjustmentStart}
            onEnd={onAdjustmentEnd}
            onChange={(value) =>
              onAdjustmentChange(item.id, "opacity", value)
            }
          />

          <RotationControls
            itemId={item.id}
            onRotate={onRotate}
          />

          <button
            type="button"
            onClick={() => onResetImageAdjustments(item.id)}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            Reset Adjustments
          </button>
        </div>
      )}

      {item?.type === "shape" && !item.locked && (
        <div className="space-y-4">
          {!isStrokeOnlyShape(item.shapeKind) && (
            <ShapeColourControl
              label="Fill"
              value={item.fill}
              fallback={DEFAULT_SHAPE_COLOUR}
              emptyLabel="No fill"
              restoreLabel="Add fill"
              onChange={(fill) => onChangeShapeFill(item.id, fill)}
            />
          )}

          <ShapeColourControl
            label={isStrokeOnlyShape(item.shapeKind) ? "Stroke" : "Border"}
            value={item.stroke}
            fallback={DEFAULT_SHAPE_COLOUR}
            emptyLabel={
              isStrokeOnlyShape(item.shapeKind) ? "No stroke" : "No border"
            }
            restoreLabel={
              isStrokeOnlyShape(item.shapeKind) ? "Add stroke" : "Add border"
            }
            onChange={(stroke) => onChangeShapeStroke(item.id, stroke)}
          />

          {item.stroke && (
            <PropertyStepper
              key={item.id}
              label={
                isStrokeOnlyShape(item.shapeKind)
                  ? "Stroke width"
                  : "Border width"
              }
              value={item.strokeWidth}
              min={MIN_SHAPE_STROKE_WIDTH}
              max={MAX_SHAPE_STROKE_WIDTH}
              suffix="px"
              onCommit={(strokeWidth) =>
                onChangeShapeStrokeWidth(item.id, strokeWidth)
              }
              onEditStart={onAdjustmentStart}
              onEditEnd={onAdjustmentEnd}
            />
          )}

          <RotationControls itemId={item.id} onRotate={onRotate} />
        </div>
      )}
    </aside>
  );
}

function ShapeColourControl({
  label,
  value,
  fallback,
  emptyLabel,
  restoreLabel,
  onChange,
}: {
  label: string;
  value: string | null;
  fallback: string;
  emptyLabel: string;
  restoreLabel: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <InspectorField label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value ?? fallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 min-w-0 flex-1 cursor-pointer rounded-lg border border-white/10 bg-slate-800 p-1"
          aria-label={`${label} colour`}
        />
        <button
          type="button"
          onClick={() => onChange(value ? null : fallback)}
          className="h-9 shrink-0 rounded-lg bg-slate-800 px-2 text-[10px] font-bold text-slate-200 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {value ? emptyLabel : restoreLabel}
        </button>
      </div>
    </InspectorField>
  );
}

function InspectorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function RotationControls({
  itemId,
  onRotate,
}: {
  itemId: string;
  onRotate: (id: string, amount: number) => void;
}) {
  return (
    <InspectorField label="Rotation">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onRotate(itemId, -15)}
          className="h-9 rounded-lg bg-slate-800 text-xl font-bold text-white transition hover:bg-slate-700"
          aria-label="Rotate left"
          title="Rotate left"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => onRotate(itemId, 15)}
          className="h-9 rounded-lg bg-slate-800 text-xl font-bold text-white transition hover:bg-slate-700"
          aria-label="Rotate right"
          title="Rotate right"
        >
          ↻
        </button>
      </div>
    </InspectorField>
  );
}

function InspectorSlider({
  label,
  value,
  max,
  onStart,
  onEnd,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onStart: () => void;
  onEnd: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onPointerDown={onStart}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
        onBlur={onEnd}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-blue-500"
      />
    </label>
  );
}
