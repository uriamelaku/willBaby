import { BottomNav } from "@/components/BottomNav";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="flex flex-1 flex-col pb-20">{children}</div>
      <BottomNav />
    </>
  );
}
