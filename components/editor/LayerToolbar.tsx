"use client";

type LayerToolbarProps = {
  itemId: string;
  itemType: "image" | "text" | "shape";
  canSendBackward: boolean;
  canBringForward: boolean;
  onMoveItemLayer: (
    id: string,
    direction: "forward" | "backward" | "front" | "back"
  ) => void;
};

const protectPointer = (
  event: React.PointerEvent<HTMLButtonElement>
) => {
  event.preventDefault();
  event.stopPropagation();
};

export default function LayerToolbar({
  itemId,
  itemType,
  canSendBackward,
  canBringForward,
  onMoveItemLayer,
}: LayerToolbarProps) {
  return (
    <div
      data-editor-retain-selection
      data-text-toolbar={itemType === "text" ? itemId : undefined}
      data-image-toolbar={itemType === "image" ? itemId : undefined}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/95 px-2 shadow-lg"
    >
      <LayerButton
        label="Send Backward"
        symbol="⬇️"
        disabled={!canSendBackward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "backward")}
      />
      <LayerButton
        label="Bring Forward"
        symbol="⬆️"
        disabled={!canBringForward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "forward")}
      />
      <LayerButton
        label="Send to Back"
        symbol="⏬"
        disabled={!canSendBackward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "back")}
      />
      <LayerButton
        label="Bring to Front"
        symbol="⏫"
        disabled={!canBringForward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "front")}
      />
    </div>
  );
}

function LayerButton({
  label,
  symbol,
  disabled,
  onPointerDown,
  onClick,
}: {
  label: string;
  symbol: string;
  disabled: boolean;
  onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={label}
      title={label}
    >
      {symbol}
    </button>
  );
}
