const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseOwnerUserIds(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(/[;,\n]/)
      .map((id) => id.trim().toLowerCase())
      .filter((id) => USER_ID_PATTERN.test(id)),
  );
}

export function isAllowedOwnerUserId(
  userId: string | null | undefined,
  configuredUserIds: string | undefined,
) {
  if (!userId) return false;
  return parseOwnerUserIds(configuredUserIds).has(userId.trim().toLowerCase());
}
