"use client";

type ImageItem = {
  id: string;
  type: "image";
  brightness: number;
  contrast: number;
  saturation: number;
  opacity: number;
};

type ImageAdjustment =
  | "brightness"
  | "contrast"
  | "saturation"
  | "opacity";

type ImageToolbarProps = {
  item: ImageItem;
  showAdjustments: boolean;
  onToggleAdjustments: () => void;
  onRotate: (id: string, amount: number) => void;
  onAdjustmentChange: (
    id: string,
    adjustment: ImageAdjustment,
    value: number
  ) => void;
  onResetAdjustments: (id: string) => void;
};

export default function ImageToolbar({
  item,
  showAdjustments,
  onToggleAdjustments,
  onRotate,
  onAdjustmentChange,
  onResetAdjustments,
}: ImageToolbarProps) {
  const stopPointerEvent = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    event.stopPropagation();
  };

  return (
    <div
      data-image-toolbar={item.id}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={stopPointerEvent}
      onPointerMove={stopPointerEvent}
      onPointerUp={stopPointerEvent}
      className="mb-3 w-full min-w-0 max-w-full select-none overflow-hidden rounded-2xl bg-slate-900/95 p-3 shadow-lg"
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div className="flex min-w-0 items-center justify-center gap-2 overflow-x-auto">
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={() => onRotate(item.id, -15)}
          className="shrink-0 cursor-pointer rounded-full bg-slate-700 px-4 py-1 text-xl font-bold text-white"
          aria-label="Rotate image left"
        >
          ↺
        </button>

        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={() => onRotate(item.id, 15)}
          className="shrink-0 cursor-pointer rounded-full bg-slate-700 px-4 py-1 text-xl font-bold text-white"
          aria-label="Rotate image right"
        >
          ↻
        </button>

        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={onToggleAdjustments}
          className="shrink-0 cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white"
        >
          {showAdjustments
            ? "Hide Adjustments"
            : "Adjust Image"}
        </button>
      </div>

      {showAdjustments && (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <AdjustmentSlider
            label="Brightness"
            value={item.brightness}
            min={0}
            max={200}
            onChange={(value) =>
              onAdjustmentChange(
                item.id,
                "brightness",
                value
              )
            }
          />

          <AdjustmentSlider
            label="Contrast"
            value={item.contrast}
            min={0}
            max={200}
            onChange={(value) =>
              onAdjustmentChange(
                item.id,
                "contrast",
                value
              )
            }
          />

          <AdjustmentSlider
            label="Saturation"
            value={item.saturation}
            min={0}
            max={200}
            onChange={(value) =>
              onAdjustmentChange(
                item.id,
                "saturation",
                value
              )
            }
          />

          <AdjustmentSlider
            label="Opacity"
            value={item.opacity}
            min={0}
            max={100}
            onChange={(value) =>
              onAdjustmentChange(
                item.id,
                "opacity",
                value
              )
            }
          />

          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => onResetAdjustments(item.id)}
            className="cursor-pointer rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold text-white md:col-span-2"
          >
            Reset Adjustments
          </button>
        </div>
      )}
    </div>
  );
}

type AdjustmentSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function AdjustmentSlider({
  label,
  value,
  min,
  max,
  onChange,
}: AdjustmentSliderProps) {
  return (
    <label className="block min-w-0 text-xs font-semibold text-slate-200">
      <span className="mb-1 flex items-center justify-between gap-3">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </span>

      <input
  type="range"
  min={min}
  max={max}
  step={1}
  value={value}
  onPointerDown={(event) => {
    event.stopPropagation();
  }}
  onPointerMove={(event) => {
    event.stopPropagation();
  }}
  onPointerUp={(event) => {
    event.stopPropagation();
  }}
  onPointerCancel={(event) => {
    event.stopPropagation();
  }}
  onChange={(event) =>
    onChange(Number(event.target.value))
  }
  className="block w-full min-w-0 cursor-pointer"
/>
    </label>
  );
}