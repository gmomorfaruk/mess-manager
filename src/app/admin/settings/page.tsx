import AppShell from "@/components/layout/AppShell";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <AppShell requiredRoles={["admin"]}>
      <SettingsClient />
    </AppShell>
  );
}
