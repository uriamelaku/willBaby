import type { Surprise } from "@/content/schema";

const CONFETTI_COLORS = ["bg-brand", "bg-mint", "bg-sun"];
const PIECES = Array.from({ length: 24 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 8) * 0.35}s`,
  duration: `${3 + (index % 3)}s`,
}));

/** Decorative full-screen animation behind a surprise; nothing moves for reduced motion. */
export function SurpriseEffect({ effect }: { effect: Surprise["effect"] }) {
  if (effect === "heartbeat") return null; // The emoji itself beats (see SurpriseOverlay).
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden">
      {PIECES.map((piece, index) =>
        effect === "confetti" ? (
          <span
            key={index}
            className={`absolute top-0 block h-3 w-2 rounded-sm ${CONFETTI_COLORS[index % CONFETTI_COLORS.length]}`}
            style={{ left: piece.left, animation: `confetti-fall ${piece.duration} linear ${piece.delay} infinite` }}
          />
        ) : (
          index % 3 === 0 && (
            <span
              key={index}
              className="absolute top-0 text-4xl"
              style={{ left: piece.left, animation: `balloon-rise ${piece.duration} ease-in ${piece.delay} infinite` }}
            >
              🎈
            </span>
          )
        ),
      )}
    </div>
  );
}
