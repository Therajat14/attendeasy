import React from "react";
import { motion } from "framer-motion";
import { Github, Sun, Moon } from "lucide-react";

export default function App() {
  const [dark, setDark] = React.useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
        {/* Navbar */}
        <nav className="border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold tracking-tight">AttendEasy</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <a
              href="https://github.com/Therajat14/attendeasy"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 border border-neutral-900 dark:border-white px-4 py-2 text-sm font-medium hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition"
            >
              <Github size={16} /> GitHub
            </a>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-4 sm:px-6 md:px-10 py-16 sm:py-20 text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight"
          >
            Smart QR Based Attendance Platform
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base"
          >
            AttendEasy is a modern attendance and presence verification system
            built for colleges, classrooms, and institutions. The platform
            prevents proxy attendance using time-locked QR sessions and
            real-time validation.
          </motion.p>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Project Currently In Development
            </p>
          </motion.div>
        </section>

        {/* Feature Preview */}
        <section className="px-4 sm:px-6 md:px-10 pb-20 max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "QR Based Attendance",
            "CR + Teacher Workflow",
            "Smart Timetable",
            "Attendance Analytics",
            "Multi Role Dashboards",
            "Future SaaS Multi College Support",
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg">{feature}</h3>
              <p className="text-sm mt-2 text-neutral-600 dark:text-neutral-400">
                UI preview placeholder. Full feature implementation is coming
                soon.
              </p>
            </motion.div>
          ))}
        </section>

        {/* Future Roles Preview */}
        <section className="border-t border-neutral-200 dark:border-neutral-800 py-16 px-4 sm:px-6 md:px-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold">
              Multi Role Academic System
            </h2>

            <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
              AttendEasy supports role-based dashboards for Students, Teachers,
              CRs, and Admins with collaborative attendance workflows.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
              {["Student", "Teacher", "CR", "Admin"].map((role) => (
                <div
                  key={role}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-xl py-4 text-sm font-medium"
                >
                  {role}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} AttendEasy — UI Prototype In Progress
        </footer>
      </div>
    </div>
  );
}
