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
      <div
  aria-hidden="true"
  className={`pointer-events-none absolute left-1/2 top-0 z-50 h-full w-px -translate-x-1/2 bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)] transition-opacity duration-150 ${
    vertical
      ? "opacity-100"
      : "opacity-0"
  }`}
/>

<div
  aria-hidden="true"
  className={`pointer-events-none absolute left-0 top-1/2 z-50 h-px w-full -translate-y-1/2 bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)] transition-opacity duration-150 ${
    horizontal
      ? "opacity-100"
      : "opacity-0"
  }`}
/>
    </>
  );
}
