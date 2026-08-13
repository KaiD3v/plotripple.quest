import type { Dictionary } from "@/i18n/get-dictionary";
import { OrnamentDivider } from "@/components/ui/ornament-divider";

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
    <article className="page-gutter mx-auto w-full max-w-3xl py-10">
      <h1 className="break-words font-display text-4xl text-bone">{content.title}</h1>
      <OrnamentDivider className="mt-5 max-w-xs" />
      {"lead" in content ? (
        <p className="mt-5 text-lg text-lichen">{content.lead}</p>
      ) : null}
      {notice ? (
        <p className="mt-4 border border-bronze/45 bg-elevated/70 px-3 py-2 text-sm text-gold">
          {notice}
        </p>
      ) : null}
      {body?.map((paragraph) => (
        <p key={paragraph} className="mt-5 leading-relaxed text-lichen">
          {paragraph}
        </p>
      ))}
      {extraSections?.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="font-display text-2xl text-bone">{section.title}</h2>
          <p className="mt-3 leading-relaxed text-lichen">{section.body}</p>
        </section>
      ))}
    </article>
  );
}
