import Link from "next/link";
import { Crest } from "@/components/brand/crest";
import { MetatronsCube } from "@/components/brand/metatrons-cube";

export default function Home() {
  return (
    <main className="threshold">
      <MetatronsCube className="threshold__geometry" />
      <section className="threshold__content" aria-labelledby="marginalia-title">
        <div className="threshold__ceremony">
          <p className="eyebrow threshold__eyebrow">A sanctuary for the reading life</p>
          <Crest className="threshold__crest" priority />
          <h1 id="marginalia-title" className="wordmark">
            Marginalia
          </h1>
        </div>
        <div className="threshold__invitation">
          <div className="rule" aria-hidden="true" />
          <p className="threshold__promise">
            A quiet place to tend to the books that shape you, while remembering
            what moved you when the pages turned.
          </p>
          <blockquote className="threshold__quotation">
            <p>“If one cannot enjoy reading a book over and over again, there is no use in reading it at all.”</p>
            <cite>Oscar Wilde</cite>
          </blockquote>
          <div className="threshold__actions">
            <Link className="button button--primary" href="/app">
              Enter Marginalia
            </Link>
            <Link className="button button--quiet" href="/about">
              Read our purpose
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
