import { NavLink, useNavigate } from "react-router-dom";
import { CalendarCheck2, LayoutDashboard, LogOut, ScrollText, X } from "lucide-react";
import Logo from "../ui/Logo";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../lib/constants";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const navByRole: Record<string, NavItem[]> = {
  teacher: [
    { to: "/teacher/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/teacher/sessions", label: "Sessions", icon: CalendarCheck2 },
  ],
  student: [
    { to: "/student/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/student/history", label: "My attendance", icon: ScrollText },
  ],
};

interface SidebarContentProps {
  onNavigate?: () => void;
}

export default function AppSidebar({ onNavigate }: SidebarContentProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = navByRole[user?.role ?? ""] ?? [];

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full flex-col gap-6 bg-white px-4 py-5 dark:bg-ink-900">
      <div className="flex items-center justify-between px-1">
        <Logo />
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="inline-flex size-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-100 lg:hidden dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-ink-400 uppercase">
          Workspace
        </p>

        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`size-[18px] shrink-0 ${isActive ? "text-brand-600 dark:text-brand-300" : "text-ink-400 group-hover:text-ink-600 dark:group-hover:text-ink-200"}`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-3 dark:border-ink-800 dark:bg-ink-800/40">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ink-900 dark:text-white">
              {user?.name}
            </p>
            <p className="truncate text-[11.5px] text-ink-500 dark:text-ink-400">
              {ROLE_LABELS[user?.role ?? ""] ?? "Member"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-ink-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-red-500/40 dark:hover:bg-red-950/30 dark:hover:text-red-300"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
