import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRPresentationProps {
  value: string;
  title: string;
  subtitle?: string;
  timeLeft?: string;
  isUrgent?: boolean;
}

function getStageSize() {
  const longestEdge =
    Math.max(window.screen?.width || 0, window.screen?.height || 0) ||
    Math.max(window.innerWidth, window.innerHeight);

  return Math.max(220, Math.min(900, Math.round(longestEdge * 0.72)));
}

export default function QRPresentation({
  value,
  title,
  subtitle,
  timeLeft,
  isUrgent,
}: QRPresentationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageSize, setStageSize] = useState(480);
  const stageRef = useRef<HTMLDivElement>(null);

  const open = useCallback(async () => {
    setIsOpen(true);
    setStageSize(getStageSize());
  }, []);

  const close = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* browser refused to leave fullscreen, close the overlay anyway */
      }
    }
    setIsOpen(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (stageRef.current) {
        await stageRef.current.requestFullscreen();
      }
    } catch {
      /* fullscreen blocked, the overlay still works as a fixed panel */
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) setStageSize(getStageSize());
    };

    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("resize", onChange);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void close();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => void open()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
      >
        <Maximize2 className="size-3.5" />
        Show on screen
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-200 flex flex-col items-center justify-center gap-8 bg-white px-6 py-10 text-center sm:px-10"
          >
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-balance text-ink-900 sm:text-3xl">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[15px] font-medium text-pretty text-ink-500 sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div
                ref={stageRef}
                className="flex items-center justify-center rounded-3xl bg-white"
              >
                <QRCodeSVG
                  value={value}
                  size={stageSize}
                  level="H"
                  marginSize={1}
                  bgColor="#ffffff"
                  fgColor="#0f1219"
                  title={`Attendance code for ${title}`}
                  className="h-auto max-h-full w-auto max-w-full"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              {timeLeft && (
                <p
                  className={`font-display text-lg font-extrabold tabular-nums ${
                    isUrgent ? "text-red-600" : "text-ink-900"
                  }`}
                >
                  {timeLeft} left
                </p>
              )}

              <p className="text-[15px] font-semibold text-ink-700 sm:text-base">
                Scan with your phone to mark attendance
              </p>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label={isFullscreen ? "Exit full screen" : "Go full screen"}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-ink-200 bg-white/90 text-ink-600 backdrop-blur transition hover:bg-ink-50"
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => void close()}
                aria-label="Close screen view"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-ink-200 bg-white/90 text-ink-600 backdrop-blur transition hover:bg-ink-50"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
