type AlignmentGuidesProps = {
  vertical: boolean;
  horizontal: boolean;
  displayScale: number;
};

export default function AlignmentGuides({
  vertical,
  horizontal,
  displayScale,
}: AlignmentGuidesProps) {
  // The canvas uses CSS zoom on desktop and transforms on mobile. A literal
  // 1px guide becomes a sub-pixel, near-invisible line on large presets in
  // fit view, so keep its painted screen thickness at one pixel.
  const guideThickness = 1 / Math.max(displayScale, Number.EPSILON);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[60] overflow-hidden"
      style={{
        contain: "strict",
        isolation: "isolate",
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
        <div
          data-alignment-guide="vertical"
          className="absolute left-1/2 top-0 h-full -translate-x-1/2 bg-blue-500"
          style={{
            width: guideThickness,
            visibility: vertical ? "visible" : "hidden",
          }}
        />
        <div
          data-alignment-guide="horizontal"
          className="absolute left-0 top-1/2 w-full -translate-y-1/2 bg-blue-500"
          style={{
            height: guideThickness,
            visibility: horizontal ? "visible" : "hidden",
          }}
        />
    </div>
  );
}
