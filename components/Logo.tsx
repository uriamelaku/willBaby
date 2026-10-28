/** will·B·aby: the shared B sits in a rounded, belly-like badge in the brand color. Size via font size. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <p
      dir="ltr"
      aria-label="willBaby"
      className={`flex items-baseline font-bold tracking-tight ${className}`}
    >
      will
      <span
        aria-hidden
        className="mx-[0.04em] inline-flex h-[1.3em] w-[1.15em] items-center justify-center self-center rounded-[0.6em_0.6em_0.75em_0.45em] bg-brand text-white"
      >
        B
      </span>
      aby
    </p>
  );
}
