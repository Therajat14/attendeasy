import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <header className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
        <div className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
          <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Email: {user?.email}</p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">Role: {user?.role}</p>

          <button
            onClick={handleLogout}
            className="mt-6 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
