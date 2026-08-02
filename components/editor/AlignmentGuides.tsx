type AlignmentGuidesProps = {
  vertical: boolean;
  horizontal: boolean;
};

export default function AlignmentGuides({
  vertical,
  horizontal,
}: AlignmentGuidesProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
      style={{
        contain: "strict",
        isolation: "isolate",
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
        <div
          className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-blue-500"
          style={{ visibility: vertical ? "visible" : "hidden" }}
        />
        <div
          className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-blue-500"
          style={{ visibility: horizontal ? "visible" : "hidden" }}
        />
    </div>
  );
}
