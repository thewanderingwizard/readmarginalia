import "server-only";
import type { User } from "@supabase/supabase-js";
import { isAllowedOwnerUserId } from "@/lib/owner-access";

export function isMarginaliaOwner(user: Pick<User, "id"> | null | undefined) {
  return isAllowedOwnerUserId(user?.id, process.env.MARGINALIA_OWNER_USER_IDS);
}
