import { notFound } from "next/navigation";
import { LibraryTopicScreen } from "@/features/library/components/LibraryTopicScreen";
import { getLibraryTopic, getLibraryTopics } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLibraryTopics().map((topic) => ({ id: topic.id }));
}

export default async function LibraryTopicPage({ params }: PageProps<"/library/[id]">) {
  const { id } = await params;
  const topic = getLibraryTopic(id);
  if (!topic) notFound();
  return <LibraryTopicScreen topic={topic} />;
}
