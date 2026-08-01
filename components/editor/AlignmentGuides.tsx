type AlignmentGuidesProps = {
  vertical: boolean;
  horizontal: boolean;
};

export default function AlignmentGuides({
  vertical,
  horizontal,
}: AlignmentGuidesProps) {
  return (
    <>
      {vertical && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-50 h-full w-px -translate-x-1/2 bg-blue-500"
        />
      )}

      {horizontal && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 z-50 h-px w-full -translate-y-1/2 bg-blue-500"
        />
      )}
    </>
  );
}
