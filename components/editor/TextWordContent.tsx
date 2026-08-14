type TextWordContentProps = {
  value: string;
};

/**
 * Keeps normal words atomic for WebKit's line breaker. A word moves intact
 * to the next line; only a single word wider than its entire containing box
 * may use emergency character breaks inside its own capped span.
 */
export default function TextWordContent({ value }: TextWordContentProps) {
  return value.split(/(\s+)/).map((segment, index) =>
    segment && !/\s/.test(segment) ? (
      <span
        key={`${index}-${segment}`}
        data-text-word
        className="inline-block max-w-full [overflow-wrap:anywhere]"
      >
        {segment}
      </span>
    ) : (
      segment
    )
  );
}
