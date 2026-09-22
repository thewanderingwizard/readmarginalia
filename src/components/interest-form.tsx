"use client";

import { useState, type FormEvent } from "react";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqewrdlk";

type SubmissionState = "idle" | "submitting" | "succeeded" | "failed";

export function InterestForm() {
  const [state, setState] = useState<SubmissionState>("idle");

  async function submitInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("submitting");

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Formspree submission failed");
      form.reset();
      setState("succeeded");
    } catch {
      setState("failed");
    }
  }

  if (state === "succeeded") {
    return (
      <section className="interest-card interest-card--received" aria-live="polite">
        <p className="eyebrow">Address received</p>
        <h2>Your name rests at the threshold.</h2>
        <p>
          If an invitation becomes available, a private passage into Marginalia will arrive by email.
        </p>
      </section>
    );
  }

  return (
    <section className="interest-card" aria-labelledby="interest-title">
      <p className="eyebrow">Invitation correspondence</p>
      <h2 id="interest-title">Leave your address at the threshold.</h2>
      <p className="interest-card__introduction">
        If Marginalia speaks to you, leave your email for consideration in a future invitation round.
      </p>
      <form
        className="interest-form"
        action={FORMSPREE_ENDPOINT}
        method="POST"
        onSubmit={submitInterest}
      >
        <input type="hidden" name="_subject" value="New Marginalia access interest" />
        <input type="hidden" name="source" value="Public Marginalia threshold" />
        <label htmlFor="interest-email">Email address</label>
        <div className="interest-form__row">
          <input
            id="interest-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="reader@example.com"
            disabled={state === "submitting"}
            required
          />
          <button type="submit" disabled={state === "submitting"}>
            {state === "submitting" ? "Sending…" : "Leave my email"}
          </button>
        </div>
      </form>
      <p className="interest-card__consent">
        By submitting, you agree to receive email from Marginalia about access. No account is created.
      </p>
      {state === "failed" ? (
        <p className="interest-card__error" role="alert">
          Your address could not be sent. Please wait a moment and try again.
        </p>
      ) : null}
    </section>
  );
}
