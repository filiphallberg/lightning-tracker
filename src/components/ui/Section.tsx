import type { ReactNode } from "react";
import { Reveal } from "./Reveal.tsx";

/** Page section wrapper with optional eyebrow, title, description, and scroll-reveal animation. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <header className="mb-8 max-w-2xl">
          {eyebrow ? (
            <p className="mb-3 inline-flex rounded-full border border-subtle px-3 py-1 text-xs font-semibold tracking-[0.18em] text-violet-bolt uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">{title}</h2>
          {description ? (
            <p className="mt-3 text-pretty text-ink-muted">{description}</p>
          ) : null}
        </header>
      </Reveal>
      {children}
    </section>
  );
}
