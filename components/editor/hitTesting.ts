import type {
  DesignItem,
  ElementDesignItem,
  ImageDesignItem,
  Position,
  ShapeDesignItem,
} from "./editor.types";
import { getShapePath } from "./shape.geometry";
import { getElementAsset } from "./elements/elements.catalog";

export const RASTER_ALPHA_HIT_THRESHOLD = 16;
export const SHAPE_HIT_TOLERANCE = {
  desktop: 2,
  touch: 6,
} as const;
const MAX_RASTER_HIT_TEST_DIMENSION = 1024;

type RasterAlphaMap = {
  source: string;
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
  alpha: Uint8ClampedArray;
};

type VisibleContentHitTestContext = {
  item: DesignItem;
  canvasPoint: Position;
  element: HTMLElement;
  canvasScale: number;
  pointerType: string;
};

type VisibleContentHitTester<T extends DesignItem> = (
  context: VisibleContentHitTestContext & { item: T }
) => boolean;

const rasterAlphaCache = new WeakMap<HTMLImageElement, RasterAlphaMap>();
let shapeHitTestContext: CanvasRenderingContext2D | null = null;

const getRasterAlphaMap = (
  image: HTMLImageElement
): RasterAlphaMap | null => {
  if (
    !image.complete ||
    image.naturalWidth <= 0 ||
    image.naturalHeight <= 0
  ) {
    return null;
  }

  const source = image.currentSrc || image.src;
  const cached = rasterAlphaCache.get(image);

  if (
    cached &&
    cached.source === source &&
    cached.naturalWidth === image.naturalWidth &&
    cached.naturalHeight === image.naturalHeight
  ) {
    return cached;
  }

  const sampleScale = Math.min(
    1,
    MAX_RASTER_HIT_TEST_DIMENSION /
      Math.max(image.naturalWidth, image.naturalHeight)
  );
  const width = Math.max(1, Math.round(image.naturalWidth * sampleScale));
  const height = Math.max(1, Math.round(image.naturalHeight * sampleScale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) return null;

  try {
    context.drawImage(image, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height).data;
    const alpha = new Uint8ClampedArray(width * height);

    for (
      let sourceIndex = 3, alphaIndex = 0;
      sourceIndex < pixels.length;
      sourceIndex += 4, alphaIndex += 1
    ) {
      alpha[alphaIndex] = pixels[sourceIndex];
    }

    const alphaMap = {
      source,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width,
      height,
      alpha,
    };

    rasterAlphaCache.set(image, alphaMap);
    return alphaMap;
  } catch {
    // Cross-origin sources that cannot be sampled keep rectangular hit
    // behaviour rather than becoming unexpectedly click-through.
    return null;
  }
};

const toUnrotatedLocalPoint = (
  item: Pick<DesignItem, "position" | "rotation">,
  canvasPoint: Position
) => {
  const deltaX = canvasPoint.x - item.position.x;
  const deltaY = canvasPoint.y - item.position.y;
  const rotation = (-item.rotation * Math.PI) / 180;

  return {
    x:
      deltaX * Math.cos(rotation) -
      deltaY * Math.sin(rotation),
    y:
      deltaX * Math.sin(rotation) +
      deltaY * Math.cos(rotation),
  };
};

const getShapeHitTestContext = () => {
  if (shapeHitTestContext) return shapeHitTestContext;

  const canvas = document.createElement("canvas");

  shapeHitTestContext = canvas.getContext("2d");
  return shapeHitTestContext;
};

const hitTestImage: VisibleContentHitTester<ImageDesignItem> = ({
  item,
  canvasPoint,
  element,
}) => {
  const image = element.querySelector("img");

  if (!image) return true;
  if (image.complete && image.naturalWidth === 0) return false;

  const alphaMap = getRasterAlphaMap(image);

  if (!alphaMap) return true;

  const localPoint = toUnrotatedLocalPoint(item, canvasPoint);
  const contentScale = Math.min(
    item.size.width / alphaMap.naturalWidth,
    item.size.height / alphaMap.naturalHeight
  );
  const contentWidth = alphaMap.naturalWidth * contentScale;
  const contentHeight = alphaMap.naturalHeight * contentScale;
  const contentX = localPoint.x + contentWidth / 2;
  const contentY = localPoint.y + contentHeight / 2;

  if (
    contentX < 0 ||
    contentY < 0 ||
    contentX >= contentWidth ||
    contentY >= contentHeight
  ) {
    return false;
  }

  const sampleX = Math.min(
    alphaMap.width - 1,
    Math.floor((contentX / contentWidth) * alphaMap.width)
  );
  const sampleY = Math.min(
    alphaMap.height - 1,
    Math.floor((contentY / contentHeight) * alphaMap.height)
  );
  const alpha =
    alphaMap.alpha[sampleY * alphaMap.width + sampleX] *
    (item.opacity / 100);

  return alpha >= RASTER_ALPHA_HIT_THRESHOLD;
};

const hitTestShape: VisibleContentHitTester<ShapeDesignItem> = ({
  item,
  canvasPoint,
  canvasScale,
  pointerType,
}) => {
  const context = getShapeHitTestContext();

  if (!context) return true;

  const localPoint = toUnrotatedLocalPoint(item, canvasPoint);
  const shapePoint = {
    x: localPoint.x + item.size.width / 2,
    y: localPoint.y + item.size.height / 2,
  };
  const path = new Path2D(getShapePath(item));
  const hasVisibleFill = item.fill !== null;
  const hasVisibleStroke =
    item.stroke !== null && item.strokeWidth > 0;

  if (
    hasVisibleFill &&
    context.isPointInPath(path, shapePoint.x, shapePoint.y)
  ) {
    return true;
  }

  if (!hasVisibleStroke) return false;

  const screenTolerance =
    pointerType === "touch"
      ? SHAPE_HIT_TOLERANCE.touch
      : SHAPE_HIT_TOLERANCE.desktop;
  const logicalTolerance =
    screenTolerance /
    (Number.isFinite(canvasScale) && canvasScale > 0
      ? canvasScale
      : 1);

  context.save();
  context.lineWidth = item.strokeWidth + logicalTolerance * 2;
  context.lineCap = "round";
  context.lineJoin = "round";

  const hitsStroke = context.isPointInStroke(
    path,
    shapePoint.x,
    shapePoint.y
  );

  context.restore();
  return hitsStroke;
};

// Converts an SVG geometry primitive into an equivalent Path2D so it can be
// hit-tested through the same Canvas2D isPointInPath/isPointInStroke calls
// shapes use - unlike SVGGeometryElement.isPointInStroke(), Canvas2D lets us
// set an arbitrary lineWidth, which is exactly what adds click tolerance.
const buildPath2DForGeometry = (
  geometry: SVGGeometryElement
): Path2D | null => {
  const tag = geometry.tagName.toLowerCase();
  const num = (name: string) => Number(geometry.getAttribute(name) ?? 0);

  if (tag === "path") {
    const d = geometry.getAttribute("d");
    return d ? new Path2D(d) : null;
  }

  const path = new Path2D();

  if (tag === "circle") {
    path.arc(num("cx"), num("cy"), num("r"), 0, Math.PI * 2);
    return path;
  }

  if (tag === "ellipse") {
    path.ellipse(num("cx"), num("cy"), num("rx"), num("ry"), 0, 0, Math.PI * 2);
    return path;
  }

  if (tag === "rect") {
    path.rect(num("x"), num("y"), num("width"), num("height"));
    return path;
  }

  if (tag === "line") {
    path.moveTo(num("x1"), num("y1"));
    path.lineTo(num("x2"), num("y2"));
    return path;
  }

  if (tag === "polyline" || tag === "polygon") {
    const points = (geometry.getAttribute("points") ?? "")
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    for (let i = 0; i + 1 < points.length; i += 2) {
      if (i === 0) path.moveTo(points[0], points[1]);
      else path.lineTo(points[i], points[i + 1]);
    }
    if (tag === "polygon") path.closePath();
    return path;
  }

  return null;
};

const hitTestElement: VisibleContentHitTester<ElementDesignItem> = (
  context
) => {
  const { item, canvasPoint, element, canvasScale, pointerType } = context;
  const asset = getElementAsset(item.elementId);

  if (!asset) return true;

  if (asset.insertion.kind === "shape") {
    return hitTestShape({
      ...context,
      item: {
        ...item,
        type: "shape",
        shapeKind: asset.insertion.shapeKind,
      },
    });
  }

  const svg = element.querySelector("svg");
  if (!svg) return true;

  const localPoint = toUnrotatedLocalPoint(item, canvasPoint);
  const viewBox = svg.viewBox.baseVal;
  const point = new DOMPoint(
    viewBox.x +
      ((localPoint.x + item.size.width / 2) / item.size.width) *
        viewBox.width,
    viewBox.y +
      ((localPoint.y + item.size.height / 2) / item.size.height) *
        viewBox.height
  );

  const canvasContext = getShapeHitTestContext();
  if (!canvasContext) return true;

  // Thin or open artwork (a hashtag, a line-art icon) has almost no fill
  // area to land on, so every catalog element needs the same forgiving
  // click tolerance shapes already get - without this, hitting the exact
  // 1-2px-wide painted stroke is what was making some elements take
  // several attempts to reselect. Screen-pixel tolerance is converted into
  // this SVG's own viewBox units, since that's the space isPointInStroke
  // operates in, and that scale changes with the item's size and zoom.
  const screenTolerance =
    pointerType === "touch" ? SHAPE_HIT_TOLERANCE.touch : SHAPE_HIT_TOLERANCE.desktop;
  const screenPxPerViewBoxUnit =
    (item.size.width * canvasScale) / (viewBox.width || 1);
  const logicalTolerance =
    screenPxPerViewBoxUnit > 0 ? screenTolerance / screenPxPerViewBoxUnit : 0;

  return Array.from(
    svg.querySelectorAll<SVGGeometryElement>(
      "path, rect, circle, ellipse, line, polyline, polygon"
    )
  ).some((geometry) => {
    try {
      const path = buildPath2DForGeometry(geometry);
      if (!path) return true;

      const fillAttr = geometry.getAttribute("fill");
      const hasVisibleFill = fillAttr !== null && fillAttr !== "none";

      if (
        hasVisibleFill &&
        canvasContext.isPointInPath(path, point.x, point.y)
      ) {
        return true;
      }

      const strokeAttr = geometry.getAttribute("stroke");
      const hasVisibleStroke = strokeAttr !== null && strokeAttr !== "none";
      const strokeWidth = hasVisibleStroke
        ? Number(geometry.getAttribute("stroke-width") ?? 1)
        : 0;

      // Even a fill-only shape (no stroke) still gets tolerance around its
      // own outline, so thin fill slivers aren't harder to hit than
      // stroked ones - clamp to a minimum so zero-stroke shapes aren't
      // hit-tested with a zero-width line.
      const effectiveStrokeWidth = Math.max(strokeWidth, 0.01);

      canvasContext.save();
      canvasContext.lineWidth = effectiveStrokeWidth + logicalTolerance * 2;
      canvasContext.lineCap = "round";
      canvasContext.lineJoin = "round";

      const hitsStroke = canvasContext.isPointInStroke(
        path,
        point.x,
        point.y
      );

      canvasContext.restore();
      return hitsStroke;
    } catch {
      return true;
    }
  });
};

const visibleContentHitTesters: Partial<{
  [Type in DesignItem["type"]]: VisibleContentHitTester<
    Extract<DesignItem, { type: Type }>
  >;
}> = {
  image: hitTestImage,
  shape: hitTestShape,
  element: hitTestElement,
};

export const isPointerInsideVisibleContent = ({
  item,
  canvasPoint,
  element,
  canvasScale,
  pointerType,
}: VisibleContentHitTestContext) => {
  if (item.hidden) return false;

  const tester = visibleContentHitTesters[item.type] as
    | VisibleContentHitTester<DesignItem>
    | undefined;

  return tester
    ? tester({
        item,
        canvasPoint,
        element,
        canvasScale,
        pointerType,
      })
    : true;
};
