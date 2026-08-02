"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  type LucideIcon,
} from "lucide-react";

type LayerToolbarProps = {
  itemId: string;
  itemType: "image" | "text" | "shape" | "element";
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
      className="editor-toolbar-surface editor-motion flex h-10 items-center justify-center gap-1 px-1.5"
    >
      <LayerButton
        label="Send Backward"
        icon={ArrowDown}
        disabled={!canSendBackward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "backward")}
      />
      <LayerButton
        label="Bring Forward"
        icon={ArrowUp}
        disabled={!canBringForward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "forward")}
      />
      <LayerButton
        label="Send to Back"
        icon={ChevronsDown}
        disabled={!canSendBackward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "back")}
      />
      <LayerButton
        label="Bring to Front"
        icon={ChevronsUp}
        disabled={!canBringForward}
        onPointerDown={protectPointer}
        onClick={() => onMoveItemLayer(itemId, "front")}
      />
    </div>
  );
}

function LayerButton({
  label,
  icon: Icon,
  disabled,
  onPointerDown,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
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
      className="editor-toolbar-control flex h-8 w-8 cursor-pointer items-center justify-center"
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
