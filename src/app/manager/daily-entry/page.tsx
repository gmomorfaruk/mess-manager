import AppShell from "@/components/layout/AppShell";
import DailyEntryClient from "./DailyEntryClient";

export default function DailyEntryPage() {
  return (
    <AppShell requiredRoles={["admin", "manager"]}>
      <DailyEntryClient />
    </AppShell>
  );
}
