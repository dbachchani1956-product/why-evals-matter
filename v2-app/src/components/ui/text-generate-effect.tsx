"use client";
import { cn } from "@/lib/utils";

// Aceternity's text-generate effect, driven by CSS keyframes instead of a JS animation
// loop: same word-by-word blur-in, but it always completes, even when scripts stall,
// and it shows the full text immediately for readers who prefer reduced motion.
export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const wordsArray = words.split(" ");

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="dark:text-white text-black text-2xl leading-snug tracking-wide">
          <div>
            {wordsArray.map((word, idx) => (
              <span
                key={word + idx}
                className={cn("tge-word dark:text-white text-black", filter && "tge-blur")}
                style={{ animationDuration: `${duration}s`, animationDelay: `${idx * 0.12}s` }}
              >
                {word}{" "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
