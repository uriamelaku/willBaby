import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface StepLayoutProps {
  title: string;
  step: number;
  totalSteps: number;
  children: ReactNode;
  onBack: () => void;
  /** Called on submit; the step validates and advances. */
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function StepLayout({
  title,
  step,
  totalSteps,
  children,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: StepLayoutProps) {
  const t = useTranslations();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6" noValidate>
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          {t("onboarding.progress", { step, total: totalSteps })}
        </p>
        <h1 className="text-3xl font-semibold">{title}</h1>
      </header>
      <div className="flex flex-col gap-6">{children}</div>
      <footer className="mt-auto flex gap-3 pt-4">
        <Button variant="secondary" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button type="submit" disabled={nextDisabled} className="flex-1">
          {nextLabel ?? t("common.next")}
        </Button>
      </footer>
    </form>
  );
}
