import Link from "next/link";
import { Crest } from "@/components/brand/crest";

export default function AboutPage() {
  return (
    <main className="reading-page">
      <article className="reading-panel reading-panel--article">
        <Link className="text-link" href="/">
          ← Return to the threshold
        </Link>
        <Crest className="article-crest" />
        <p className="eyebrow">For all the readers</p>
        <h1 className="display-title">A place built around attention.</h1>
        <div className="prose">
          <p>
            Marginalia exists to help readers remember the books that formed
            them and the thoughts that appeared in the margins along the way.
          </p>
          <p>
            It is private before it is public, reflective before it is social,
            and designed to reward returning to a book rather than performing
            engagement around it.
          </p>
          <p>
            The reader owns their record. Core reflections remain exportable,
            and paid features will support deeper preservation, presentation,
            and craft—not hold a reader&apos;s words hostage.
          </p>
        </div>
      </article>
    </main>
  );
}
