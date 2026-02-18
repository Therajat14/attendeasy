import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <p className="mt-2 text-neutral-500">Role: {user?.role}</p>

      <button onClick={logout} className="mt-6 px-4 py-2 border rounded">
        Logout
      </button>
    </div>
  );
}
