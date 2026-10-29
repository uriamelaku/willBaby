import type { RecordInput, Settings } from "@/lib/storage/types";

/** Every tool on the Tools screen, in display order; `id` is also its message key in `tools`. */
export const TOOLS = [
  { id: "appointments", href: "/tools/appointments", icon: "🩺" },
  { id: "library", href: "/library", icon: "📚" },
  { id: "kicks", href: "/tools/kicks", icon: "👣" },
  { id: "contractions", href: "/tools/contractions", icon: "⏱️" },
  { id: "weight", href: "/tools/weight", icon: "⚖️" },
  { id: "hospitalBag", href: "/tools/hospital-bag", icon: "🧳" },
  { id: "names", href: "/tools/names", icon: "📝" },
  { id: "bets", href: "/tools/bets", icon: "🎲" },
  { id: "reveal", href: "/reveal", icon: "🎁" },
] as const;

export type ToolId = (typeof TOOLS)[number]["id"];
export type Tool = (typeof TOOLS)[number];

/** Today has room for four shortcuts (2×2 beside the belly-photo square). */
export const MAX_HOME_SHORTCUTS = 4;
/** From this content week the default shortcuts lead with the kick counter and contraction timer. */
export const LATE_SHORTCUTS_WEEK = 28;

const isToolId = (id: string): id is ToolId => TOOLS.some((tool) => tool.id === id);

/** The default shortcuts for a stage of the pregnancy, until the user picks their own. */
export const defaultShortcuts = (contentWeek: number): ToolId[] =>
  contentWeek >= LATE_SHORTCUTS_WEEK
    ? ["kicks", "contractions", "hospitalBag", "weight"]
    : ["weight", "names", "hospitalBag", "bets"];

/** The tools shown on Today: the user's choice (even empty) once made, otherwise the defaults. */
export function homeShortcuts(settings: Settings | undefined, contentWeek: number): ToolId[] {
  const chosen = settings?.homeShortcuts;
  if (!chosen) return defaultShortcuts(contentWeek);
  return chosen.filter(isToolId).slice(0, MAX_HOME_SHORTCUTS);
}

/** Adds or removes a tool; adding a fifth is refused (null). Keeps the Tools screen order. */
export function toggleShortcut(current: ToolId[], tool: ToolId): ToolId[] | null {
  if (current.includes(tool)) return current.filter((id) => id !== tool);
  if (current.length >= MAX_HOME_SHORTCUTS) return null;
  return TOOLS.map((item) => item.id).filter((id) => id === tool || current.includes(id));
}

/** Settings record data with the chosen shortcuts. */
export const withShortcuts = (
  settings: RecordInput<"settings">,
  shortcuts: ToolId[],
): RecordInput<"settings"> => ({ ...settings, homeShortcuts: shortcuts });

export const findTool = (id: ToolId): Tool => TOOLS.find((tool) => tool.id === id)!;
