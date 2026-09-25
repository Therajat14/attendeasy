import { Menu } from "lucide-react";
import Logo from "../ui/Logo";
import ThemeToggle from "../ThemeToggle";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../lib/constants";
import { formatYearOfStudy } from "../../lib/format";

// `contextLabel` is the bold line on the left. It defaults to "Overview".
export default function AppTopbar({ onOpenSidebar, contextLabel }) {
  const { user } = useAuth();

  const subtitle =
    user?.course && user?.class
      ? `${user.course} · ${formatYearOfStudy(user.class)}${user.section ? ` · Section ${user.section}` : ""}`
      : (ROLE_LABELS[user?.role ?? ""] ?? "Member");

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/85 backdrop-blur-xl dark:border-ink-800/80 dark:bg-ink-950/85">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open navigation"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-ink-200 text-ink-600 transition hover:bg-ink-50 lg:hidden dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold text-ink-900 dark:text-white">
              {contextLabel ?? "Overview"}
            </p>
            <p className="hidden truncate text-[12px] text-ink-500 sm:block dark:text-ink-400">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden items-center gap-2.5 rounded-xl border border-ink-200 py-1.5 pr-3.5 pl-1.5 sm:flex dark:border-ink-800">
            <Avatar name={user?.name} size="sm" />
            <div className="leading-tight">
              <p className="max-w-[9rem] truncate text-[12.5px] font-bold text-ink-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">
                {user?.role === "student" && user.rollNo
                  ? `Roll ${user.rollNo}`
                  : ROLE_LABELS[user?.role ?? ""]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:hidden">
        <Logo size="sm" className="pb-3" />
      </div>
    </header>
  );
}
