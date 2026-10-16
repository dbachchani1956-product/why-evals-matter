import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconBook2,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconMessages,
  IconX,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, useSidebar } from "@/components/ui/sidebar";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Spotlight } from "@/components/ui/spotlight-new";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { mountLessons } from "@/lessons.js";
import steps from "@/content/steps.json";
import { cn } from "@/lib/utils";

type Card = {
  id: string;
  num: number;
  title: string;
  user: string;
  turns: { user: string; steps: { kind: string; name?: string; summary?: string; text?: string }[] }[];
};
declare global {
  interface Window {
    EVAL_DATA: { ids: string[]; cards: Record<string, Card> };
  }
}

const D = window.EVAL_DATA;
const CARDS = D.ids.map((id) => D.cards[id]);
const TOTAL = steps.length;

function stepFromHash() {
  const m = /^#step-(\d+)$/.exec(location.hash);
  return m ? Math.min(Math.max(1, Number(m[1])), TOTAL) : 1;
}

export default function App() {
  const [step, setStep] = useState(stepFromHash);
  const [sideOpen, setSideOpen] = useState(false);
  const [convo, setConvo] = useState<number | null>(null);
  const [panel, setPanel] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([stepFromHash()]));
  const lessonRef = useRef<HTMLDivElement>(null);
  const helpers = useRef<ReturnType<typeof mountLessons> | null>(null);

  const openConvo = useCallback((n: number) => {
    setConvo(n);
    setPanel(true);
  }, []);

  // all twelve lessons are in the DOM; wire their interactions once
  useLayoutEffect(() => {
    if (lessonRef.current && !helpers.current) helpers.current = mountLessons(lessonRef.current, openConvo);
  }, [openConvo]);

  useEffect(() => {
    history.replaceState(null, "", `#step-${step}`);
    window.scrollTo(0, 0);
    setVisited((v) => new Set(v).add(step));
  }, [step]);

  const cur = steps[step - 1];
  const prev = steps[step - 2];
  const next = steps[step];

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar open={sideOpen} setOpen={setSideOpen}>
          <SidebarBody className="justify-between gap-6 md:sticky md:top-0 md:h-screen md:border-r md:border-neutral-200 md:bg-neutral-50 md:dark:border-neutral-800 md:dark:bg-neutral-900">
            <StepNav step={step} visited={visited} go={(n) => { setStep(n); setSideOpen(false); }} />
          </SidebarBody>
        </Sidebar>

        <main className="relative min-w-0 flex-1 overflow-x-clip">
          {step === 1 && <Spotlight />}
          <div className="relative z-10 px-5 pb-28 pt-10 md:px-16 md:pt-16">
            <TracingBeam className="beam-wrap max-w-3xl">
              <div className="pl-2 md:pl-0">
                <div className="mb-3 flex items-center gap-3 text-sm">
                  <span className="rounded-full border border-neutral-300 px-2.5 py-0.5 font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                    {cur.part}
                  </span>
                  <span className="text-neutral-500">Step {step} of {TOTAL}</span>
                </div>
                {step === 1 && (
                  <TextGenerateEffect
                    key="hero"
                    words="Two answers from the same AI agent. One is made up."
                    className="mb-4 font-semibold [&_div.text-2xl]:text-3xl md:[&_div.text-2xl]:text-5xl [&_div.text-2xl]:leading-tight [&_div.text-2xl]:tracking-tight"
                    duration={0.4}
                    filter={false}
                  />
                )}
                <div ref={lessonRef} className="lesson">
                  {steps.map((s) => (
                    <section
                      key={s.n}
                      hidden={s.n !== step}
                      className={cn("step", s.n === 1 && "is-hero")}
                      dangerouslySetInnerHTML={{ __html: s.html }}
                    />
                  ))}
                </div>

                <nav className="mt-14 flex flex-wrap gap-3 border-t border-neutral-200 pt-8 dark:border-neutral-800" aria-label="Step navigation">
                  {prev && (
                    <button type="button" onClick={() => setStep(step - 1)} className="group flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-left transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600">
                      <IconChevronLeft className="h-4 w-4 shrink-0 text-neutral-500 transition group-hover:-translate-x-0.5" />
                      <span className="min-w-0"><span className="block text-xs text-neutral-500">Previous</span><span className="block truncate font-medium">{prev.title}</span></span>
                    </button>
                  )}
                  {next && (
                    <button type="button" onClick={() => setStep(step + 1)} className="group ml-auto flex min-w-0 items-center gap-3 rounded-xl bg-neutral-900 px-5 py-3 text-right text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                      <span className="min-w-0"><span className="block text-xs opacity-70">Next</span><span className="block truncate font-medium">{next.title}</span></span>
                      <IconChevronRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
                    </button>
                  )}
                </nav>
              </div>
            </TracingBeam>
          </div>
        </main>

        <ConvoPanel cards={CARDS} openNum={convo} setOpenNum={setConvo} mobileOpen={panel} setMobileOpen={setPanel} renderConvo={(id) => helpers.current?.convo(id, { bare: true, detailed: true }) ?? ""} />
      </div>

      <button
        type="button"
        onClick={() => setPanel(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-lg xl:hidden dark:bg-white dark:text-neutral-900"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <IconMessages className="h-4 w-4" /> Conversations
      </button>
    </div>
  );
}

function StepNav({ step, visited, go }: { step: number; visited: Set<number>; go: (n: number) => void }) {
  const { open, animate } = useSidebar();
  const showText = !animate || open;
  let lastPart = "";
  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none]">
      <div className="mb-4 flex items-center gap-3 py-1 pl-1">
        <IconBook2 className="h-6 w-6 shrink-0 text-neutral-800 dark:text-neutral-100" />
        {showText && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre leading-tight">
            <div className="text-sm font-semibold">Evals, step by step</div>
            <div className="text-xs text-neutral-500">A guide by Deepak Bachchani</div>
          </motion.div>
        )}
      </div>
      {steps.map((s) => {
        const header = s.part !== lastPart;
        lastPart = s.part;
        const active = s.n === step;
        const done = visited.has(s.n) && !active;
        return (
          <div key={s.n}>
            {header && showText && <div className="pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{s.part}</div>}
            <button
              type="button"
              onClick={() => go(s.n)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg py-1.5 text-left text-sm transition",
                active ? "text-neutral-950 dark:text-white" : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-medium tabular-nums",
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                    : done
                      ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "border-neutral-300 dark:border-neutral-700",
                )}
              >
                {done ? <IconCheck className="h-3.5 w-3.5" /> : s.n}
              </span>
              {showText && <span className="whitespace-pre">{s.title}</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConvoPanel({
  cards,
  openNum,
  setOpenNum,
  mobileOpen,
  setMobileOpen,
  renderConvo,
}: {
  cards: Card[];
  openNum: number | null;
  setOpenNum: (n: number | null) => void;
  mobileOpen: boolean;
  setMobileOpen: (b: boolean) => void;
  renderConvo: (id: string) => string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (openNum == null) return;
    const el = listRef.current?.querySelector(`[data-card="${openNum}"]`);
    requestAnimationFrame(() => el?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }, [openNum]);

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-5 dark:border-neutral-800">
        <div>
          <div className="font-semibold">The eight conversations</div>
          <p className="mt-0.5 text-sm text-neutral-500">Every example comes from one of these. Click one to read it.</p>
        </div>
        <button type="button" onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-neutral-500 hover:text-neutral-900 xl:hidden dark:hover:text-white" aria-label="Close conversations">
          <IconX className="h-5 w-5" />
        </button>
      </div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {cards.map((c) => {
          const isOpen = openNum === c.num;
          return (
            <div key={c.id} data-card={c.num} className={cn("scroll-mt-4 overflow-hidden rounded-xl border bg-white dark:bg-neutral-900", isOpen ? "border-neutral-900 dark:border-neutral-300" : "border-neutral-200 dark:border-neutral-800")}>
              <button type="button" onClick={() => setOpenNum(isOpen ? null : c.num)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-semibold tabular-nums dark:bg-neutral-800">{c.num}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{c.title}</span>
                  <span className={cn("block text-xs text-neutral-500", !isOpen && "truncate")}>“{c.turns[0].user}”</span>
                </span>
              </button>
              {/* Opens with a CSS fade only: content is never left hidden waiting on a JS animation */}
              {isOpen && (
                <div className="lesson panel-convo panel-open px-3.5 pb-4">
                  <p className="mb-2 font-mono text-[11px] text-neutral-500">{c.user} · {c.turns.length} turn{c.turns.length > 1 ? "s" : ""}</p>
                  <div dangerouslySetInnerHTML={{ __html: renderConvo(c.id) }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[380px] shrink-0 border-l border-neutral-200 bg-neutral-50 xl:block 2xl:w-[420px] dark:border-neutral-800 dark:bg-neutral-900/50" aria-label="The eight conversations">
        {body}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 xl:hidden" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-neutral-50 shadow-2xl xl:hidden dark:bg-neutral-900" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} aria-label="The eight conversations">
              {body}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
