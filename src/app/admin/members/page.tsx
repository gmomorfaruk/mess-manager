import AppShell from "@/components/layout/AppShell";
import MembersClient from "./MembersClient";

export default function MembersPage() {
  return (
    <AppShell requiredRoles={["admin"]}>
      <MembersClient />
    </AppShell>
  );
}
