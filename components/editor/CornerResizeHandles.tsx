import type { ResizeCorner } from "./editor.types";

const HANDLES: Array<{
  corner: ResizeCorner;
  cursor: string;
  left: number | string;
  top: number | string;
  transform: string;
}> = [
  {
    corner: "top-left",
    cursor: "cursor-nwse-resize",
    left: 0,
    top: 0,
    transform: "translate(-50%, -50%)",
  },
  {
    corner: "top-right",
    cursor: "cursor-nesw-resize",
    left: "100%",
    top: 0,
    transform: "translate(-50%, -50%)",
  },
  {
    corner: "bottom-left",
    cursor: "cursor-nesw-resize",
    left: 0,
    top: "100%",
    transform: "translate(-50%, -50%)",
  },
  {
    corner: "bottom-right",
    cursor: "cursor-nwse-resize",
    left: "100%",
    top: "100%",
    transform: "translate(-50%, -50%)",
  },
];

export default function CornerResizeHandles({
  displayScale,
  onResizeStart,
}: {
  displayScale: number;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    corner: ResizeCorner
  ) => void;
}) {
  return HANDLES.map(({ corner, cursor, left, top, transform }) => (
    <div
      key={corner}
      role="button"
      aria-label={`Resize from ${corner.replace("-", " ")}`}
      className={`absolute z-30 flex items-center justify-center ${cursor}`}
      style={{
        left,
        top,
        width: 24 / displayScale,
        height: 24 / displayScale,
        transform,
        touchAction: "none",
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onResizeStart(event, corner);
      }}
    >
      <span
        aria-hidden="true"
        className="block rounded-[1px] bg-blue-500"
        style={{
          width: 5 / displayScale,
          height: 5 / displayScale,
          outline: `${1 / displayScale}px solid white`,
        }}
      />
    </div>
  ));
}
