"use client";

import { Lock, RotateCcw, RotateCw } from "lucide-react";

import {
  TEXT_MAX_FONT_SIZE,
  TEXT_MIN_FONT_SIZE,
  TEXT_FONT_SIZE_STEP,
} from "./editor.constants";
import FontPicker from "./FontPicker";
import GripixColorPicker from "./ColorPicker";
import type {
  DesignItem,
  ImageAdjustment,
} from "./editor.types";
import LayersPanel from "./LayersPanel";
import {
  getElementAsset,
  getElementColourMode,
} from "./elements/elements.catalog";
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
  onChangeElementOpacity: (id: string, opacity: number) => void;
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
  onChangeElementOpacity,
  onAdjustmentStart,
  onAdjustmentEnd,
  onResetImageAdjustments,
  onAdjustmentChange,
}: EditorInspectorProps) {
  return (
    <aside
      data-editor-retain-selection
      className="editor-floating-panel editor-scrollbar hidden h-full min-h-0 flex-col overflow-y-auto rounded-xl p-3 text-sm text-slate-300 md:flex"
    >
      <LayersPanel
        items={items}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        onReorderLayers={onReorderLayers}
        onToggleVisibility={onToggleLayerVisibility}
        onToggleLock={onToggleLayerLock}
      />

      <div className="my-4 shrink-0 border-t border-white/10" />

      <p className="mb-4 shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
        Properties
      </p>

      {!item && (
        <p className="rounded-xl border border-white/10 bg-slate-800/60 p-3 text-sm text-slate-400">
          Select an item to edit
        </p>
      )}

      {item?.locked && (
        <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Lock size={15} aria-hidden="true" />
            This object is locked.
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
            <FontPicker
              itemId={item.id}
              value={item.fontFamily}
              onChange={(fontFamily) =>
                onChangeTextFont(item.id, fontFamily)
              }
              variant="inspector"
            />
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
            <GripixColorPicker
              value={item.color}
              onChange={(color) => onChangeTextColor(item.id, color)}
              allowAlpha
              ariaLabel="Text colour"
              buttonClassName="w-full justify-between"
              showHexText
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

      {item?.type === "element" && !item.locked && (() => {
        const asset = getElementAsset(item.elementId);
        const colourMode = asset ? getElementColourMode(asset) : "none";
        const supportsFill = colourMode === "fill-and-stroke";
        const supportsStroke = colourMode !== "none";

        return (
          <div className="space-y-4">
            {supportsFill && (
              <ShapeColourControl
                label="Fill"
                value={item.fill}
                fallback={DEFAULT_SHAPE_COLOUR}
                emptyLabel="No fill"
                restoreLabel="Add fill"
                onChange={(fill) => onChangeShapeFill(item.id, fill)}
              />
            )}
            {supportsStroke && (
              <>
                <ShapeColourControl
                  label={supportsFill ? "Border" : "Stroke"}
                  value={item.stroke}
                  fallback={DEFAULT_SHAPE_COLOUR}
                  emptyLabel={supportsFill ? "No border" : "No stroke"}
                  restoreLabel={supportsFill ? "Add border" : "Add stroke"}
                  onChange={(stroke) => onChangeShapeStroke(item.id, stroke)}
                />
                {item.stroke && (
                  <PropertyStepper
                    key={item.id}
                    label={supportsFill ? "Border width" : "Stroke width"}
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
              </>
            )}
            <InspectorSlider
              label="Opacity"
              value={item.opacity}
              max={100}
              onStart={onAdjustmentStart}
              onEnd={onAdjustmentEnd}
              onChange={(opacity) => onChangeElementOpacity(item.id, opacity)}
            />
            <RotationControls itemId={item.id} onRotate={onRotate} />
          </div>
        );
      })()}
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
        <GripixColorPicker
          value={value ?? fallback}
          onChange={(color) => onChange(color)}
          allowAlpha
          ariaLabel={`${label} colour`}
          buttonClassName="flex-1 justify-between min-w-0"
          showHexText
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
          className="editor-panel-control flex h-9 items-center justify-center rounded-lg"
          aria-label="Rotate left"
          title="Rotate left"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onRotate(itemId, 15)}
          className="editor-panel-control flex h-9 items-center justify-center rounded-lg"
          aria-label="Rotate right"
          title="Rotate right"
        >
          <RotateCw size={16} aria-hidden="true" />
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
