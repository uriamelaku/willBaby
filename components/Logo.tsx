export function Logo({ className = "" }: { className?: string }) {
  return (
    <p
      dir="ltr"
      aria-label="willBaby"
      className={`text-5xl font-semibold tracking-tight ${className}`}
    >
      will·<span className="text-brand">B</span>·aby
    </p>
  );
}
