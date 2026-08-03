type AlignmentGuidesProps = {
  vertical: boolean;
  horizontal: boolean;
};

export default function AlignmentGuides({
  vertical,
  horizontal,
}: AlignmentGuidesProps) {
  if (!vertical && !horizontal) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
    >
      {vertical && (
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-blue-500" />
      )}
      {horizontal && (
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-blue-500" />
      )}
    </div>
  );
}
