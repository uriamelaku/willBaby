import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-on-brand font-semibold",
  secondary: "bg-card text-text border border-text/20",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`min-h-11 min-w-11 rounded-full px-6 py-2 transition active:scale-95 disabled:opacity-50 motion-reduce:transition-none ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
