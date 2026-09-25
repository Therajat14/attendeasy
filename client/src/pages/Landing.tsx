import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Link2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import Badge, { LiveBadge } from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import MarketingLayout from "../layouts/MarketingLayout";

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const stats = [
  { value: "10 sec", label: "Average time per student" },
  { value: "30 min", label: "Session window per lecture" },
  { value: "1 tap", label: "To mark your presence" },
  { value: "Live", label: "Teacher view of the class" },
];

const steps = [
  {
    icon: CalendarCheck2,
    title: "Start a session",
    body: "Pick the subject, year and section. AttendEasy opens a time-boxed attendance window for that class.",
  },
  {
    icon: QrCode,
    title: "Share one code",
    body: "Project the code or send the link. Every student in the class sees it instantly on their phone.",
  },
  {
    icon: BadgeCheck,
    title: "Everyone is marked",
    body: "Students confirm with a single tap. The teacher's roster fills in real time until the window closes.",
  },
];

const features = [
  {
    icon: Zap,
    title: "Seconds, not queues",
    body: "No roll calls, no registers passed down the row. The whole class is marked before the lecture settles in.",
  },
  {
    icon: ShieldCheck,
    title: "One mark per student",
    body: "Every student can only be recorded once per session, and the window closes automatically when time is up.",
  },
  {
    icon: Users,
    title: "Right class, right students",
    body: "Codes are matched to a course, year and section, so codes shared in the wrong group simply won't work.",
  },
  {
    icon: BarChart3,
    title: "Records you can trust",
    body: "Every session is stored with the time each student marked, ready to review subject by subject.",
  },
  {
    icon: Link2,
    title: "Works on any phone",
    body: "No app to install. Students join from the browser link their teacher shares in class.",
  },
  {
    icon: Clock3,
    title: "Session control",
    body: "See who's in, close the window early, or start the next lecture the moment the previous one ends.",
  },
];

const audiences = [
  {
    icon: Users,
    title: "For teachers",
    points: [
      "Run a session without leaving the dashboard",
      "Watch the roster fill in real time",
      "Review any past session in a few clicks",
    ],
  },
  {
    icon: BadgeCheck,
    title: "For students",
    points: [
      "Mark attendance from any phone",
      "See which lectures are live right now",
      "Track your own attendance record",
    ],
  },
  {
    icon: Sparkles,
    title: "For departments",
    points: [
      "A single, consistent way to take attendance",
      "Clean records across every section",
      "Far fewer disputes and corrections",
    ],
  },
];

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </section>
  );
}

function LivePreview() {
  const roster = [
    { name: "Aarav Sharma", roll: "21", time: "10:02" },
    { name: "Ishita Verma", roll: "07", time: "10:03" },
    { name: "Rohan Mehta", roll: "34", time: "10:04" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reveal}
      custom={0.2}
      className="relative"
    >
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/60 via-transparent to-violet-200/50 blur-2xl dark:from-brand-500/20 dark:to-violet-500/10" />

      <div className="rounded-3xl border border-ink-200/80 bg-white/90 p-5 shadow-overlay backdrop-blur-sm sm:p-6 dark:border-ink-800 dark:bg-ink-900/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-ink-400 uppercase">
              Live session
            </p>
            <h3 className="mt-1.5 text-[17px] font-extrabold text-ink-900 dark:text-white">
              Data Structures
            </h3>
            <p className="mt-1 text-[12.5px] text-ink-500 dark:text-ink-400">
              BCA · 2nd Year · Section B
            </p>
          </div>
          <LiveBadge />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink-50 p-3.5 dark:bg-ink-800/50">
            <p className="text-[11px] font-semibold text-ink-500 dark:text-ink-400">
              Time left
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-ink-900 dark:text-white">
              24:38
            </p>
          </div>
          <div className="rounded-2xl bg-ink-50 p-3.5 dark:bg-ink-800/50">
            <p className="text-[11px] font-semibold text-ink-500 dark:text-ink-400">
              Marked present
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-ink-900 dark:text-white">
              38<span className="text-[13px] font-semibold text-ink-400"> / 60</span>
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 rounded-2xl border border-ink-200/80 p-3.5 dark:border-ink-800">
          {roster.map((student) => (
            <div key={student.roll} className="flex items-center gap-3">
              <Avatar name={student.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-ink-900 dark:text-white">
                  {student.name}
                </p>
                <p className="text-[11px] text-ink-500 dark:text-ink-400">
                  Roll {student.roll}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {student.time}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[11.5px] text-ink-400">
          Students are marking in as you read this
        </p>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden">
        <div className="surface-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-500/10" />

        <Section className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div>
            <motion.div initial="hidden" animate="visible" variants={reveal}>
              <Badge tone="brand" icon={<Sparkles className="size-3.5" />}>
                Built for real classrooms
              </Badge>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={reveal}
              custom={0.05}
              className="mt-6 font-display text-[34px] leading-[1.08] font-extrabold tracking-tight text-ink-900 sm:text-5xl lg:text-[56px]"
            >
              Attendance that takes
              <br className="hidden sm:block" />{" "}
              <span className="text-gradient">seconds, not minutes.</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={reveal}
              custom={0.1}
              className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-600 sm:text-base dark:text-ink-300"
            >
              Start a lecture session, share one code, and the whole class marks itself.
              Teachers get a live roster, students get their record, and proxy
              attendance stops being a conversation.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={reveal}
              custom={0.15}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <ButtonLink
                to="/signup"
                size="lg"
                trailingIcon={<ArrowRight className="size-4" />}
              >
                Get started free
              </ButtonLink>
              <ButtonLink to="/login" variant="secondary" size="lg">
                I already have an account
              </ButtonLink>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={reveal}
              custom={0.2}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-ink-500 dark:text-ink-400"
            >
              {["No app to install", "Works on any phone", "Free for your class"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    {item}
                  </span>
                ),
              )}
            </motion.p>
          </div>

          <LivePreview />
        </Section>
      </section>

      <section className="border-y border-ink-200 bg-ink-50/70 py-8 dark:border-ink-800 dark:bg-ink-900/30">
        <Section>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={reveal}
                custom={index * 0.06}
              >
                <p className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-[12.5px] font-medium text-ink-500 dark:text-ink-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </Section>
      </section>

      <Section id="how-it-works" className="py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11.5px] font-bold tracking-wider text-brand-600 uppercase dark:text-brand-400">
            How it works
          </p>
          <h2 className="mt-3 font-display text-[28px] font-extrabold text-ink-900 sm:text-[36px] dark:text-white">
            Three steps, one minute
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
            The same routine every lecture, whether you teach thirty students or three
            hundred.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={reveal}
              custom={index * 0.08}
              className="group relative rounded-2xl border border-ink-200/80 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated dark:border-ink-800 dark:bg-ink-900/70"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-300">
                <step.icon className="size-5" />
              </span>

              <p className="mt-5 text-[11.5px] font-bold tracking-wider text-ink-400 uppercase">
                Step {index + 1}
              </p>
              <h3 className="mt-1.5 text-[17px] font-extrabold text-ink-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-500 dark:text-ink-400">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      <section className="border-y border-ink-200 bg-ink-50/70 py-20 sm:py-24 dark:border-ink-800 dark:bg-ink-900/30">
        <Section id="features">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11.5px] font-bold tracking-wider text-brand-600 uppercase dark:text-brand-400">
                Features
              </p>
              <h2 className="mt-3 font-display text-[28px] font-extrabold text-ink-900 sm:text-[36px] dark:text-white">
                Everything you need to take attendance properly
              </h2>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-ink-500 dark:text-ink-400">
              Deliberately simple. No training, no new hardware, no changes to how your
              class already works.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={reveal}
                custom={index * 0.05}
                className="rounded-2xl border border-ink-200/80 bg-white p-6 shadow-soft transition hover:shadow-elevated dark:border-ink-800 dark:bg-ink-900/70"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
                  <feature.icon className="size-[18px]" />
                </span>
                <h3 className="mt-4.5 text-[16px] font-extrabold text-ink-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500 dark:text-ink-400">
                  {feature.body}
                </p>
              </motion.div>
            ))}
          </div>
        </Section>
      </section>

      <Section id="institutions" className="py-20 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={reveal}
              custom={index * 0.07}
              className="rounded-2xl border border-ink-200/80 bg-white p-6 shadow-soft dark:border-ink-800 dark:bg-ink-900/70"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <audience.icon className="size-[18px]" />
                </span>
                <h3 className="text-[16px] font-extrabold text-ink-900 dark:text-white">
                  {audience.title}
                </h3>
              </div>

              <ul className="mt-5 space-y-3">
                {audience.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-600 dark:text-ink-300"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={reveal}
          className="relative mt-6 overflow-hidden rounded-3xl border border-ink-800 bg-ink-950 p-8 sm:p-12"
        >
          <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand-500/25 blur-3xl" />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-[26px] font-extrabold text-white sm:text-[32px]">
                Take your next lecture with AttendEasy
              </h2>
              <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink-300">
                Set up your account, invite your class, and mark the first session in
                under five minutes.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <ButtonLink
                to="/signup"
                size="lg"
                trailingIcon={<ArrowRight className="size-4" />}
                className="bg-white text-ink-950 hover:bg-ink-100 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100"
              >
                Create free account
              </ButtonLink>
              <ButtonLink
                to="/login"
                variant="secondary"
                size="lg"
                className="border-ink-700 bg-transparent text-ink-100 hover:bg-ink-800"
              >
                See a live session
              </ButtonLink>
            </div>
          </div>
        </motion.div>
      </Section>
    </MarketingLayout>
  );
}
