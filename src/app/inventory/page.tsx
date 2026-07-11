import InventoryClient from "@/components/inventory/InventoryClient";

export const metadata = {
  title: "Faltantes y repetidas · ALBUMFIND",
  description:
    "Consulta y administra las láminas faltantes y repetidas del álbum.",
};

export default function InventoryPage() {
  return <InventoryClient />;
}
