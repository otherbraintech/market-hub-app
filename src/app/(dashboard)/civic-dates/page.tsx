import { getCivicDatesAction } from "@/actions/civic-dates";
import { CivicDatesView } from "@/components/civic-dates/civic-dates-view";

export const dynamic = "force-dynamic";

export default async function CivicDatesPage() {
  const result = await getCivicDatesAction();
  const initialDates = result.success ? result.data : [];

  return <CivicDatesView initialDates={initialDates} />;
}
