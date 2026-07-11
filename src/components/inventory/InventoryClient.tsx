"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Copy,
  FileDown,
  FileSpreadsheet,
  LoaderCircle,
  Search,
  Sticker,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import InventorySelect from "@/components/inventory/InventorySelect";
import {
  exportInventoryCsv,
  exportInventoryPdf,
} from "@/lib/inventoryExport";
import { useAlbumStore } from "@/store/useAlbumStore";

type InventoryMode = "missing" | "duplicates";

type InventoryRecord = {
  teamCode: string;
  teamName: string;
  group: string;
  stickerCode: string;
  number: number;
  duplicates: number;
};

export default function InventoryClient() {
  const teams = useAlbumStore((state) => state.teams);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);

  const [mode, setMode] = useState<InventoryMode>("missing");
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    void useAlbumStore.persist.rehydrate();
  }, []);

  const allRecords = useMemo<InventoryRecord[]>(() => {
    return teams.flatMap((team) =>
      team.stickers.map((sticker) => ({
        teamCode: team.code,
        teamName: team.name,
        group: team.group,
        stickerCode: sticker.code,
        number: sticker.number,
        duplicates: sticker.duplicates,
      })),
    );
  }, [teams]);

  const missingCodes = useMemo(() => {
    return new Set(
      teams.flatMap((team) =>
        team.stickers
          .filter((sticker) => sticker.status === "missing")
          .map((sticker) => sticker.code),
      ),
    );
  }, [teams]);

  const groups = useMemo(() => {
    return Array.from(new Set(teams.map((team) => team.group))).sort();
  }, [teams]);

  const filteredTeams = useMemo(() => {
    if (groupFilter === "all") {
      return teams;
    }

    return teams.filter((team) => team.group === groupFilter);
  }, [groupFilter, teams]);

  const records = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allRecords.filter((record) => {
      const matchesMode =
        mode === "missing"
          ? missingCodes.has(record.stickerCode)
          : record.duplicates > 0;

      const matchesGroup =
        groupFilter === "all" || record.group === groupFilter;

      const matchesTeam =
        teamFilter === "all" || record.teamCode === teamFilter;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        record.stickerCode.toLowerCase().includes(normalizedQuery) ||
        record.teamName.toLowerCase().includes(normalizedQuery) ||
        record.teamCode.toLowerCase().includes(normalizedQuery);

      return (
        matchesMode &&
        matchesGroup &&
        matchesTeam &&
        matchesSearch
      );
    });
  }, [
    allRecords,
    groupFilter,
    missingCodes,
    mode,
    query,
    teamFilter,
  ]);

  const totalUnits = useMemo(() => {
    if (mode === "missing") {
      return records.length;
    }

    return records.reduce(
      (total, record) => total + record.duplicates,
      0,
    );
  }, [mode, records]);

  async function copyCurrentList() {
    const heading =
      mode === "missing"
        ? "Láminas faltantes"
        : "Láminas repetidas";

    const lines = records.map((record) => {
      if (mode === "missing") {
        return `${record.stickerCode} · ${record.teamName} · Grupo ${record.group}`;
      }

      return `${record.stickerCode} · ${record.teamName} · ${record.duplicates} repetida${
        record.duplicates === 1 ? "" : "s"
      }`;
    });

    const content = [
      heading,
      `Total: ${totalUnits}`,
      "",
      ...lines,
    ].join("\n");

    await navigator.clipboard.writeText(content);
    setCopied(true);
  }

  function changeGroup(nextGroup: string) {
    setGroupFilter(nextGroup);
    setTeamFilter("all");
    setCopied(false);
  }

  function handleExportCsv() {
    exportInventoryCsv({
      mode,
      records,
      totalUnits,
    });
  }

  async function handleExportPdf() {
    try {
      setIsExportingPdf(true);

      await exportInventoryPdf({
        mode,
        records,
        totalUnits,
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  if (!hasHydrated) {
    return (
      <main className="inventory-shell">
        <div className="inventory-loading">
          <span>ALBUMFIND</span>
          <strong>Cargando inventario…</strong>
        </div>
      </main>
    );
  }

  return (
    <main className="inventory-shell">
      <header className="inventory-toolbar">
        <Link href="/" className="inventory-back-link">
          <ArrowLeft size={18} />
          Volver al resumen
        </Link>

        <div className="inventory-brand">
          <span>ALBUMFIND</span>
          <strong>Gestión de colección</strong>
        </div>

        <Link href="/album" className="inventory-album-link">
          Abrir álbum
        </Link>
      </header>

      <section className="inventory-hero">
        <div>
          <p>Inventario operativo</p>
          <h1>Faltantes y repetidas</h1>
          <span>
            Consulta exactamente qué necesitas y qué tienes disponible
            para intercambio.
          </span>
        </div>

        <div className="inventory-total-card">
          <small>
            {mode === "missing"
              ? "Láminas faltantes"
              : "Unidades repetidas"}
          </small>
          <strong>{totalUnits}</strong>
        </div>
      </section>

      <section className="inventory-panel">
        <div className="inventory-tabs">
          <button
            className={mode === "missing" ? "active" : ""}
            onClick={() => {
              setMode("missing");
              setCopied(false);
            }}
            type="button"
          >
            <Sticker size={18} />
            Me faltan
          </button>

          <button
            className={mode === "duplicates" ? "active" : ""}
            onClick={() => {
              setMode("duplicates");
              setCopied(false);
            }}
            type="button"
          >
            <Copy size={18} />
            Repetidas
          </button>
        </div>

        <div className="inventory-filters">
          <label className="inventory-search">
            <Search size={17} />

            <input
              onChange={(event) => {
                setQuery(event.target.value);
                setCopied(false);
              }}
              placeholder="Buscar código o selección"
              type="search"
              value={query}
            />
          </label>

          <InventorySelect
            ariaLabel="Filtrar por grupo"
            onChange={changeGroup}
            options={[
              {
                value: "all",
                label: "Todos los grupos",
              },
              ...groups.map((group) => ({
                value: group,
                label: `Grupo ${group}`,
              })),
            ]}
            value={groupFilter}
          />

          <InventorySelect
            ariaLabel="Filtrar por selección"
            onChange={(nextTeam) => {
              setTeamFilter(nextTeam);
              setCopied(false);
            }}
            options={[
              {
                value: "all",
                label: "Todas las selecciones",
              },
              ...filteredTeams.map((team) => ({
                value: team.code,
                label: team.name,
              })),
            ]}
            value={teamFilter}
          />

          <div className="inventory-export-actions">
            <button
              className="inventory-copy-button"
              disabled={records.length === 0}
              onClick={() => void copyCurrentList()}
              type="button"
            >
              {copied ? (
                <Check size={17} />
              ) : (
                <ClipboardCopy size={17} />
              )}

              {copied ? "Lista copiada" : "Copiar"}
            </button>

            <button
              className="inventory-export-button"
              disabled={records.length === 0}
              onClick={handleExportCsv}
              type="button"
            >
              <FileSpreadsheet size={17} />
              CSV
            </button>

            <button
              className="inventory-export-button inventory-export-pdf"
              disabled={records.length === 0 || isExportingPdf}
              onClick={() => void handleExportPdf()}
              type="button"
            >
              {isExportingPdf ? (
                <LoaderCircle
                  className="inventory-export-spinner"
                  size={17}
                />
              ) : (
                <FileDown size={17} />
              )}

              {isExportingPdf ? "Generando…" : "PDF"}
            </button>
          </div>
        </div>

        <div className="inventory-results-heading">
          <div>
            <strong>
              {records.length} código{records.length === 1 ? "" : "s"}
            </strong>

            <span>
              {mode === "duplicates"
                ? `${totalUnits} unidades disponibles`
                : `${totalUnits} pendientes`}
            </span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="inventory-empty">
            <strong>
              {mode === "missing"
                ? "No hay faltantes con estos filtros."
                : "No hay repetidas con estos filtros."}
            </strong>

            <span>
              Cambia los filtros o actualiza el estado desde el álbum.
            </span>
          </div>
        ) : (
          <div className="inventory-grid">
            {records.map((record) => (
              <article
                className="inventory-card"
                key={record.stickerCode}
              >
                <div className="inventory-card-code">
                  <span>{record.teamCode}</span>
                  <strong>{record.number}</strong>
                </div>

                <div className="inventory-card-copy">
                  <small>Grupo {record.group}</small>
                  <h2>{record.stickerCode}</h2>
                  <p>{record.teamName}</p>

                  {mode === "duplicates" && (
                    <div className="inventory-duplicate-badge">
                      {record.duplicates} repetida
                      {record.duplicates === 1 ? "" : "s"}
                    </div>
                  )}
                </div>

                <Link
                  href={`/album?team=${record.teamCode}`}
                  className="inventory-card-link"
                >
                  Ver en álbum
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


