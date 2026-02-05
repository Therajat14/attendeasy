"";
import { motion } from "framer-motion";
import { Github } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg text-center"
      >
        {/* Brand */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
          AttendEasy
        </h1>

        <p className="text-sm sm:text-base text-neutral-500 mb-8 sm:mb-10">
          Smart Attendance Made Simple
        </p>

        {/* Message */}
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
          We are building something better.
        </h2>

        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8 sm:mb-10 px-1 sm:px-0">
          AttendEasy is currently under development. The platform will provide
          fast and secure attendance using time-locked QR codes, shared links,
          and real-time verification.
          <br />
          <br />
          The project will soon be available publicly.
        </p>

        {/* Status */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 mb-8 sm:mb-10">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          <p className="text-xs sm:text-sm text-neutral-600">In Progress</p>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full">
          <a
            href="https://github.com/Therajat14/attendeasy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-neutral-900 px-5 py-2.5 text-sm sm:text-base font-medium hover:bg-neutral-900 hover:text-white transition w-full sm:w-auto"
          >
            <Github size={18} />
            GitHub Repository
          </a>

          <a
            href="https://attendeasy-delta.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 text-sm sm:text-base font-medium border border-neutral-300 text-neutral-700 hover:border-indigo-500 hover:text-indigo-600 transition w-full sm:w-auto text-center"
          >
            Live Preview (Soon)
          </a>
        </div>

        {/* Footer */}
        <p className="text-[11px] sm:text-xs text-neutral-400 mt-12 sm:mt-16">
          © {new Date().getFullYear()} AttendEasy
        </p>
      </motion.div>
    </div>
  );
}
