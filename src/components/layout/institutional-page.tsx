import type { Dictionary } from "@/i18n/get-dictionary";

export function InstitutionalPage({
  content,
  draftNotice,
  sections,
}: {
  content: Dictionary["about"] | Dictionary["privacy"] | Dictionary["terms"];
  draftNotice?: string;
  sections?: Array<{ title: string; body: string }>;
}) {
  const extraSections =
    sections ?? ("sections" in content ? content.sections : undefined);
  const body = "body" in content ? content.body : undefined;
  const notice =
    draftNotice ?? ("draftNotice" in content ? content.draftNotice : undefined);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-mist">{content.title}</h1>
      {"lead" in content ? (
        <p className="mt-4 text-lg text-mist-dim">{content.lead}</p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-sm border border-gold-dim/40 bg-canopy/40 px-3 py-2 text-sm text-gold">
          {notice}
        </p>
      ) : null}
      {body?.map((paragraph) => (
        <p key={paragraph} className="mt-5 leading-relaxed text-mist-dim">
          {paragraph}
        </p>
      ))}
      {extraSections?.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="font-display text-2xl text-gold">{section.title}</h2>
          <p className="mt-3 leading-relaxed text-mist-dim">{section.body}</p>
        </section>
      ))}
    </article>
  );
}
