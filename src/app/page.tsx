import Link from "next/link";
import { Crest } from "@/components/brand/crest";

export default function Home() {
  return (
    <main className="threshold">
      <div className="threshold__geometry" aria-hidden="true" />
      <section className="threshold__content" aria-labelledby="marginalia-title">
        <p className="eyebrow">A sanctuary for the reading life</p>
        <Crest className="threshold__crest" priority />
        <h1 id="marginalia-title" className="wordmark">
          Marginalia
        </h1>
        <div className="rule" aria-hidden="true" />
        <p className="threshold__promise">
          A quiet place to tend the books that shape you—and to remember what
          moved you when the page has turned.
        </p>
        <p className="threshold__principle">Private by default. Yours by design.</p>
        <div className="threshold__actions">
          <Link className="button button--primary" href="/app">
            Enter Marginalia
          </Link>
          <Link className="button button--quiet" href="/about">
            Read our purpose
          </Link>
        </div>
      </section>
    </main>
  );
}
