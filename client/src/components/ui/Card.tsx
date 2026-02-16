import { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps): JSX.Element {
  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {children}
      </div>
    </div>
  );
}
