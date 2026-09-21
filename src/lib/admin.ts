import "server-only";
import type { User } from "@supabase/supabase-js";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { isMarginaliaOwner } from "@/lib/owner";

export function isMarginaliaAdmin(user: Pick<User, "id" | "email"> | null | undefined) {
  return (
    isMarginaliaOwner(user) ||
    isAllowedAdminEmail(user?.email, process.env.MARGINALIA_ADMIN_EMAILS)
  );
}
