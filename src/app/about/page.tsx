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
        <h1 className="display-title about-title">
          <span className="about-title__line">A literary cathedral</span>
          <span className="about-title__line">built by a reader</span>
          <span className="about-title__line">for all the readers.</span>
        </h1>
        <div className="prose prose--about">
          <p>Welcome to Marginalia, and thank you so much for being here.</p>
          <p>
            Marginalia began years ago as an idea of mine: to create a living
            vessel for literary culture. Today, it exists not only to help
            readers remember the books that formed them, but also to engage
            more meaningfully with the books presently in their hands. A
            container has been created to encourage the preservation of the
            thoughts and reflections that always appear in the margins along
            the way. We know the magic lies in the journey, never merely the
            destination.
          </p>
          <p>
            Before placing a single book upon your shelves, there are a few
            things to make clear about this Alpha. Marginalia is private before
            it is public, reflective before it is social, and designed to
            reward returning to a book rather than performing engagement around
            it.
            <span className="about-prose__continuation">
              This Alpha has no algorithms, no feed, no social components, and
              no paywalls.
            </span>
          </p>
          <p>
            You, the reader, own your record. Your core reflections remain
            exportable, while future paid features will support deeper
            preservation, presentation, and craft.
            <span className="about-prose__assurance">
              Your words will always remain yours.
            </span>
          </p>
          <p>
            At the end of the Alpha period, every participant will be invited
            to a round-table discussion about the experience. A survey will
            also offer space to share what worked, what did not, what readers
            would like to see in future versions of the platform, and anything
            else they believe deserves a place at the table.
          </p>
          <p>
            This is a passion project in its most authentic form. If you are
            reading this as an Alpha invitee, please know that you were chosen
            with care, and that your participation is deeply appreciated.
          </p>
          <p>
            I believe that, with your help, Marginalia can become something
            truly timeless.
          </p>
        </div>
        <footer
          className="founder-signature"
          aria-label="Signed by Cameron Freeman, Founder of Marginalia"
        >
          <p className="founder-signature__name">Cameron Freeman</p>
          <p className="founder-signature__role">Founder of Marginalia</p>
        </footer>
      </article>
    </main>
  );
}
