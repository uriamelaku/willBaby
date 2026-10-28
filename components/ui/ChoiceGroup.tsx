"use client";

import { useId } from "react";

interface ChoiceGroupProps<T extends string> {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  /** Visually hide the legend when the screen title already says it. */
  hideLegend?: boolean;
  /** Show options side by side (for short labels). */
  inline?: boolean;
}

/** Radio group styled as large tappable options. */
export function ChoiceGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  hideLegend,
  inline,
}: ChoiceGroupProps<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "mb-3 font-semibold"}>{legend}</legend>
      <div className={inline ? "grid grid-cols-3 gap-2" : "flex flex-col gap-3"}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-11 cursor-pointer items-center rounded-2xl border-2 border-text/15 bg-card px-4 py-3 transition has-checked:border-brand has-checked:bg-brand/15 has-focus-visible:outline-2 has-focus-visible:outline-text motion-reduce:transition-none ${inline ? "justify-center" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
