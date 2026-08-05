export function parseAdminEmails(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(/[;,\n]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
export function isAllowedAdminEmail(email: string | null | undefined, configuredEmails: string | undefined) {
  if (!email) return false;
  return parseAdminEmails(configuredEmails).has(email.trim().toLowerCase());
}
