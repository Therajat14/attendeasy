import { createContext, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

// What a page passes to notify():
//   notify({ title, description, tone })
// `tone` is optional. Valid names: success, error, info.
//
// Each toast stored in state is the same object plus an `id` that the
// provider adds, so React can tell them apart.
const ToastContext = createContext(undefined);

const toneStyles = {
  success: {
    icon: <CheckCircle2 className="size-5 text-emerald-500" />,
    ring: "ring-emerald-200/80 dark:ring-emerald-500/30",
  },
  error: {
    icon: <TriangleAlert className="size-5 text-red-500" />,
    ring: "ring-red-200/80 dark:ring-red-500/30",
  },
  info: {
    icon: <Info className="size-5 text-brand-500" />,
    ring: "ring-brand-200/80 dark:ring-brand-500/30",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const notify = ({ title, description, tone = "info" }) => {
    const id = nextId.current;
    nextId.current += 1;

    // slice(-2) keeps only the two newest toasts, so the corner never fills up.
    setToasts((current) => [...current.slice(-2), { id, title, description, tone }]);

    // Each toast removes itself after a few seconds.
    window.setTimeout(() => dismiss(id), 4800);
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2.5 p-4 sm:inset-x-auto sm:right-0 sm:bottom-0 sm:items-end sm:p-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white/95 p-4 shadow-overlay ring-1 backdrop-blur dark:bg-ink-900/95 ${toneStyles[toast.tone].ring}`}
            >
              <span className="mt-0.5 shrink-0">{toneStyles[toast.tone].icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-ink-900 dark:text-white">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-md p-0.5 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
