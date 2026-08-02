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

const hitTestElement: VisibleContentHitTester<ElementDesignItem> = (
  context
) => {
  const { item, canvasPoint, element } = context;
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

  return Array.from(
    svg.querySelectorAll<SVGGeometryElement>(
      "path, rect, circle, ellipse, line, polyline, polygon"
    )
  ).some((geometry) => {
      try {
        return geometry.isPointInFill(point) || geometry.isPointInStroke(point);
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
