import { WeekScreen } from "@/features/week/components/WeekScreen";
import { MAX_CONTENT_WEEK } from "@/lib/pregnancy";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: MAX_CONTENT_WEEK }, (_, i) => ({ n: String(i + 1) }));
}

export default async function WeekPage({ params }: PageProps<"/week/[n]">) {
  const { n } = await params;
  return <WeekScreen week={Number(n)} />;
}
