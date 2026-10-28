import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AchievementsWatcher } from "@/features/achievements/components/AchievementsWatcher";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      {/* Bottom padding keeps content clear of the fixed navigation. */}
      <div className="flex flex-1 flex-col pb-[calc(74px+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
      <AchievementsWatcher />
    </>
  );
}
