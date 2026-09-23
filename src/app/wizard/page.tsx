import type { Metadata } from "next";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crest } from "@/components/brand/crest";
import { isMarginaliaOwner } from "@/lib/owner";
import { parseOwnerUserIds } from "@/lib/owner-access";
import { buildReaderRegistry, type RegistryInvitation } from "@/lib/reader-registry";
import { createMarginaliaAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendReaderAccessEmail } from "./actions";
import styles from "./wizard.module.css";

export const metadata: Metadata = {
  title: "The Wizard’s Study",
  description: "Private Marginalia Owner administration.",
  robots: { index: false, follow: false },
};

type AuditEntry = {
  id: string;
  actor_email: string | null;
  action: string;
  target_email: string | null;
  outcome: "succeeded" | "failed" | "rate_limited";
  created_at: string;
};

const accessMessages = {
  sent: { tone: "success", text: "A fresh private access email has been sent and recorded." },
  sent_unrecorded: {
    tone: "warning",
    text: "The access email was sent, but the audit entry could not be saved. Do not resend it yet.",
  },
  invalid_email: { tone: "error", text: "Enter a complete reader email address." },
  confirmation: { tone: "error", text: "Confirm the dispatch before sending an access email." },
  not_found: {
    tone: "error",
    text: "No existing Marginalia account uses that address. Invite the reader first.",
  },
  rate_limit: {
    tone: "error",
    text: "The email service is resting briefly. Wait before trying again.",
  },
  delivery: { tone: "error", text: "The access email could not be delivered. Nothing was changed." },
  audit_unavailable: {
    tone: "error",
    text: "The audit record is unavailable, so no email was sent. Apply the Wizard database migration first.",
  },
  unavailable: { tone: "error", text: "Owner administration is temporarily unavailable." },
} as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

export default async function WizardPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: keyof typeof accessMessages }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  if (!isMarginaliaOwner(data.user)) redirect("/app");

  const parameters = await searchParams;
  const accessMessage = parameters.access ? accessMessages[parameters.access] : null;
  const admin = createMarginaliaAdminClient();

  let invitations: RegistryInvitation[] = [];
  let users: User[] = [];
  let audits: AuditEntry[] = [];
  let databaseOnline = false;
  let authOnline = false;
  let storageOnline = false;
  let invitationLedgerOnline = false;
  let auditOnline = false;

  if (admin) {
    const [invitationResult, userResult, auditResult, profileResult, storageResult] = await Promise.all([
      admin
        .from("invitations")
        .select("id,email,status,created_at,accepted_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin
        .from("admin_audit_log")
        .select("id,actor_email,action,target_email,outcome,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.storage.listBuckets(),
    ]);

    invitations = (invitationResult.data as RegistryInvitation[] | null) ?? [];
    users = userResult.data?.users ?? [];
    audits = (auditResult.data as AuditEntry[] | null) ?? [];
    invitationLedgerOnline = !invitationResult.error;
    authOnline = !userResult.error;
    auditOnline = !auditResult.error;
    databaseOnline = !profileResult.error;
    storageOnline = !storageResult.error;
  }

  const ownerIds = parseOwnerUserIds(process.env.MARGINALIA_OWNER_USER_IDS);
  const ownerEmails = new Set(
    users
      .filter((user) => ownerIds.has(user.id.toLowerCase()))
      .map((user) => user.email?.toLowerCase())
      .filter((email): email is string => Boolean(email)),
  );
  const readerInvitations = invitations.filter(
    (invitation) => !ownerEmails.has(invitation.email.toLowerCase()),
  );
  const readers = buildReaderRegistry(users, readerInvitations, ownerIds, ownerEmails);
  const activated = readers.filter((reader) => reader.status === "activated").length;
  const pending = readers.filter((reader) => reader.status === "pending").length;
  const revoked = readers.filter((reader) => reader.status === "revoked").length;

  const health = [
    { label: "Database", online: databaseOnline },
    { label: "Authentication", online: authOnline },
    { label: "Private storage", online: storageOnline },
    { label: "Invitation ledger", online: invitationLedgerOnline },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Crest className={styles.crest} priority />
          <div>
            <p className={styles.eyebrow}>Owner access · private</p>
            <h1>The Wizard’s Study</h1>
            <p>A quiet operational view of Marginalia’s Alpha threshold.</p>
          </div>
          <nav className={styles.navigation} aria-label="Owner navigation">
            <Link href="/app">Return to your shelf</Link>
            <Link href="/admin/invitations">Invitation ledger</Link>
          </nav>
        </header>

        {accessMessage ? (
          <p className={`${styles.notice} ${styles[accessMessage.tone]}`} role="status">
            {accessMessage.text}
          </p>
        ) : null}

        {!admin ? (
          <p className={`${styles.notice} ${styles.error}`} role="alert">
            The server-side Supabase key is unavailable in this deployment. Owner tools remain closed.
          </p>
        ) : null}

        <section className={styles.metrics} aria-label="Alpha overview">
          <article><span>{readerInvitations.length}</span><p>Invited</p></article>
          <article><span>{activated}</span><p>Activated</p></article>
          <article><span>{pending}</span><p>Awaiting first entry</p></article>
          <article><span>{revoked}</span><p>Revoked</p></article>
        </section>

        <div className={styles.columns}>
          <section className={styles.panel} aria-labelledby="access-title">
            <p className={styles.eyebrow}>Private correspondence</p>
            <h2 id="access-title">Send a fresh passage</h2>
            <p className={styles.introduction}>
              Send a new sign-in link to an existing reader. This cannot create an account or invite an unknown address.
            </p>
            <form className={styles.form} action={sendReaderAccessEmail}>
              <label htmlFor="access-email">Existing reader email</label>
              <input id="access-email" name="email" type="email" autoComplete="off" required />
              <label className={styles.confirmation}>
                <input name="confirmation" type="checkbox" value="send" required />
                <span>I have confirmed the address and intend to send this email now.</span>
              </label>
              <button type="submit">Send private access email</button>
            </form>
            <p className={styles.finePrint}>
              New readers must still be admitted through the invitation ledger. Delivery and bounce details remain available in Brevo.
            </p>
          </section>

          <section className={styles.panel} aria-labelledby="health-title">
            <p className={styles.eyebrow}>Infrastructure</p>
            <h2 id="health-title">House status</h2>
            <ul className={styles.healthList}>
              {health.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <strong className={item.online ? styles.online : styles.attention}>
                    {item.online ? "Online" : "Attention"}
                  </strong>
                </li>
              ))}
            </ul>
            <dl className={styles.summaryList}>
              <div><dt>Revoked invitations</dt><dd>{revoked}</dd></div>
              <div><dt>Authenticated reader records</dt><dd>{readers.length}</dd></div>
              <div><dt>Audit record</dt><dd>{auditOnline ? "Available" : "Migration required"}</dd></div>
            </dl>
          </section>
        </div>

        <section className={styles.panel} aria-labelledby="readers-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Identity, not reading content</p>
              <h2 id="readers-title">Reader registry</h2>
            </div>
            <span>{readers.length} accounts and invitations</span>
          </div>
          {!readers.length ? (
            <p className={styles.empty}>No reader identities are available yet.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr><th>Reader</th><th>Status</th><th>Invited</th><th>Activated</th><th>Last sign-in</th></tr>
                </thead>
                <tbody>
                  {readers.map((reader) => (
                    <tr key={reader.email}>
                      <td>{reader.email}</td>
                      <td><span className={styles.status}>{reader.status}</span></td>
                      <td>{formatDate(reader.invitedAt)}</td>
                      <td>{formatDate(reader.activatedAt)}</td>
                      <td>{formatDate(reader.lastSignInAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="audit-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Owner accountability</p>
              <h2 id="audit-title">Administrative record</h2>
            </div>
            <span>Latest 50 actions</span>
          </div>
          {!auditOnline ? (
            <p className={`${styles.notice} ${styles.warning}`}>
              Apply the Wizard audit migration in Supabase before using correspondence controls.
            </p>
          ) : !audits.length ? (
            <p className={styles.empty}>No Owner actions have been recorded yet.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Action</th><th>Target</th><th>Outcome</th><th>When</th></tr></thead>
                <tbody>
                  {audits.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.action.replaceAll("_", " ")}</td>
                      <td>{entry.target_email ?? "—"}</td>
                      <td><span className={styles.status}>{entry.outcome.replaceAll("_", " ")}</span></td>
                      <td>{formatDate(entry.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
