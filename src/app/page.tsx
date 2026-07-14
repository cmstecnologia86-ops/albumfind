import CollectionBackupManager from "@/components/collection/CollectionBackupManager";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default function Home() {
  return (
    <>
      <DashboardClient />
      <CollectionBackupManager />
    </>
  );
}
