import { useMemo } from "react";
import {
  getElementAsset,
  getElementSvgMarkup,
} from "./elements/elements.catalog";
import type { ElementDesignItem } from "./editor.types";

export default function ElementSvg({
  item,
  className,
  style,
}: {
  item: ElementDesignItem;
  className?: string;
  style?: React.CSSProperties;
}) {
  const asset = getElementAsset(item.elementId);

  // Keep the same { __html } object reference across renders that don't
  // touch fill/stroke/strokeWidth (e.g. resize/drag/rotate). React compares
  // dangerouslySetInnerHTML by object identity, so a fresh object every
  // render forces a full innerHTML re-parse of the SVG subtree on every
  // pinch-resize frame even when the markup is unchanged, which is what was
  // causing Elements to resize in stepped increments instead of smoothly.
  const innerHtml = useMemo(
    () =>
      asset
        ? { __html: getElementSvgMarkup(asset, item) }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally scoped to the fields that affect markup, not the whole (per-render) item
    [asset, item.fill, item.stroke, item.strokeWidth]
  );

  if (!asset || !innerHtml) {
    return (
      <div className={className} style={style} aria-label={`${item.displayName} unavailable`} />
    );
  }

  return (
    <div
      role="img"
      aria-label={item.displayName}
      className={className}
      style={{ ...style, opacity: item.opacity / 100 }}
      dangerouslySetInnerHTML={innerHtml}
    />
  );
}
