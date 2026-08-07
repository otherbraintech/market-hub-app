import { getCivicDatesAction } from "@/actions/civic-dates";
import { CivicDatesView } from "@/components/civic-dates/civic-dates-view";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CivicDatesPage() {
  const [result, session] = await Promise.all([
    getCivicDatesAction(),
    getSession(),
  ]);

  const initialDates = result.success ? result.data : [];
  const userRole = session?.user?.role || "USER";
  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

  return <CivicDatesView initialDates={initialDates} isAdmin={isAdmin} />;
}
