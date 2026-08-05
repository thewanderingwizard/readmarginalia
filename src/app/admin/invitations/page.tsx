import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inviteReader } from "@/app/admin/invitations/actions";
import { Crest } from "@/components/brand/crest";
import { isMarginaliaAdmin } from "@/lib/admin";
import { createMarginaliaAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import styles from "./invitations.module.css";

export const metadata: Metadata = {
  title: "Reader Invitations",
  description: "Private Alpha invitation administration.",
  robots: { index: false, follow: false },
};

type Invitation = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  accepted_at: string | null;
};

const messages = {
  email: "Enter a complete email address before sending the invitation.",
  unavailable: "Invitation administration is not configured in this environment.",
  existing: "That address already belongs to a reader or has already been invited.",
  rate_limit: "The invitation service is resting briefly. Please try again later.",
  delivery: "The invitation could not be sent. No invitation ledger entry was created.",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: keyof typeof messages;
    sent?: string;
    reconciled?: "accepted" | "pending";
  }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  if (!isMarginaliaAdmin(data.user)) redirect("/app");

  const admin = createMarginaliaAdminClient();
  const parameters = await searchParams;
  let invitations: Invitation[] = [];
  let invitationCount = 0;
  let loadFailed = false;

  if (admin) {
    const { data: records, error: invitationError, count } = await admin
      .from("invitations")
      .select("id,email,status,created_at,accepted_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(250);
    invitations = (records as Invitation[] | null) ?? [];
    invitationCount = count ?? invitations.length;
    loadFailed = Boolean(invitationError);
  } else {
    loadFailed = true;
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="invitation-title">
        <div className={styles.heading}>
          <Crest className={styles.crest} priority />
          <div>
            <p className={styles.eyebrow}>The Alpha threshold</p>
            <h1 id="invitation-title">Reader invitations</h1>
            <p>Invite one reader at a time. Every invitation remains private and every acceptance is recorded.</p>
          </div>
        </div>

        <Link className={styles.returnLink} href="/app">← Return to your shelf</Link>

        {parameters.error ? <p className={styles.error} role="alert">{messages[parameters.error]}</p> : null}
        {parameters.sent === "1" ? <p className={styles.success} role="status">The invitation has been sent and entered in the ledger.</p> : null}
        {parameters.sent === "unrecorded" ? <p className={styles.error} role="alert">The email was sent, but its ledger entry could not be saved. Do not send it again yet.</p> : null}
        {parameters.reconciled === "pending" ? (
          <p className={styles.success} role="status">
            That address was invited before the Marginalia ledger existed. It has now been recorded as pending; no duplicate email was sent.
          </p>
        ) : null}
        {parameters.reconciled === "accepted" ? (
          <p className={styles.success} role="status">
            That reader already signed in before the Marginalia ledger existed. Their account has now been recorded as accepted; no duplicate email was sent.
          </p>
        ) : null}

        <form action={inviteReader} className={styles.form}>
          <label htmlFor="reader-email">Reader email address</label>
          <div className={styles.formRow}>
            <input id="reader-email" name="email" type="email" autoComplete="email" required placeholder="reader@example.com" />
            <button type="submit">Send invitation</button>
          </div>
          <p>The reader will receive the branded Marginalia invitation through Brevo. This form cannot create public signups.</p>
        </form>

        <section className={styles.ledger} aria-labelledby="ledger-title">
          <div className={styles.ledgerHeading}>
            <div>
              <p className={styles.eyebrow}>Private record</p>
              <h2 id="ledger-title">Invitation ledger</h2>
            </div>
            <span>{invitationCount} recorded</span>
          </div>

          {loadFailed ? <p className={styles.error}>The invitation ledger could not be loaded.</p> : null}
          {!loadFailed && !invitations.length ? <p className={styles.empty}>No invitations have been recorded through Marginalia yet.</p> : null}
          {invitations.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Reader</th><th>Status</th><th>Invited</th><th>Accepted</th></tr></thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td>{invitation.email}</td>
                      <td><span className={styles[invitation.status]}>{invitation.status}</span></td>
                      <td>{formatDate(invitation.created_at)}</td>
                      <td>{invitation.accepted_at ? formatDate(invitation.accepted_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
