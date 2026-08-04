import "server-only";
import type { User } from "@supabase/supabase-js";
import { isAllowedAdminEmail } from "@/lib/admin-access";

export function isMarginaliaAdmin(user: Pick<User, "email"> | null | undefined) {
  return isAllowedAdminEmail(user?.email, process.env.MARGINALIA_ADMIN_EMAILS);
}
