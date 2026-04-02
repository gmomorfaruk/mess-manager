import AppShell from "@/components/layout/AppShell";
import DepositsClient from "./DepositsClient";

export default function DepositsPage() {
  return (
    <AppShell requiredRoles={["admin", "manager"]}>
      <DepositsClient />
    </AppShell>
  );
}
