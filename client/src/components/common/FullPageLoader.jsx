import { motion } from "framer-motion";
import Logo from "../ui/Logo";
import Spinner from "../ui/Spinner";

export default function FullPageLoader({ label = "Getting things ready" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ink-50 px-6 dark:bg-ink-950">
      <motion.div
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Logo to="" size="lg" showWordmark={false} />
      </motion.div>

      <div className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
        <Spinner className="size-4" />
        <p className="text-[13px] font-medium">{label}…</p>
      </div>
    </div>
  );
}
