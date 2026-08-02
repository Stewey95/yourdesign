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

  if (!asset) {
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
      dangerouslySetInnerHTML={{
        __html: getElementSvgMarkup(asset, item),
      }}
    />
  );
}
