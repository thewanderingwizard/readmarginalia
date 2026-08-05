import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/brand/crest";
import { MetatronsCube } from "@/components/brand/metatrons-cube";
import { requestMagicLink } from "./actions";
import styles from "./sign-in.module.css";

export const metadata: Metadata = {
  title: "Alpha Sign In",
  description: "Return to your private Marginalia shelf.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string; sent?: string }>;
}) {
  const parameters = await searchParams;

  return (
    <main className={styles.page}>
      <MetatronsCube className={styles.geometry} />
      <section className={styles.panel} aria-labelledby="sign-in-title">
        <Crest className={styles.crest} priority />
        <p className="eyebrow">Invitation-only Alpha</p>
        <h1 id="sign-in-title" className={styles.title}>Return to your shelf.</h1>
        <p className={styles.introduction}>
          Enter the email that received your invitation. We will send a private passage back into Marginalia.
        </p>

        {parameters.deleted ? (
          <div className={styles.notice} role="status">
            Your Marginalia account and private reader record have been permanently deleted.
          </div>
        ) : null}

        {parameters.sent ? (
          <div className={styles.notice} role="status">
            If that address belongs to an invited reader, a sign-in link is now on its way.
          </div>
        ) : (
          <form className={styles.form} action={requestMagicLink}>
            <label className={styles.field}>
              <span>Email address</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            {parameters.error === "email" ? <p className={styles.error}>Enter a complete email address.</p> : null}
            {parameters.error === "link" ? (
              <p className={styles.error}>That passage has expired or has already been used. Request another below.</p>
            ) : null}
            <button className={styles.submit} type="submit">Send my passage</button>
          </form>
        )}

        <Link className={styles.returnLink} href="/">← Return to the threshold</Link>
      </section>
    </main>
  );
}
