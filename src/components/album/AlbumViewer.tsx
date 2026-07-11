"use client";

import type { MouseEvent } from "react";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import TeamSpread from "@/components/album/TeamSpread";
import groupsSource from "@/data/groups.json";
import {
  type Sticker,
  useAlbumStore,
} from "@/store/useAlbumStore";

type GroupData = {
  groups: Array<{
    id: string;
    teams: Array<{
      code: string;
      name: string;
    }>;
  }>;
};

type TurnDirection = "next" | "previous";

const groupData = groupsSource as GroupData;
const DEFAULT_TEAM_CODE = "MEX";

function StickerSlot({
  sticker,
  teamCode,
}: {
  sticker: Sticker;
  teamCode: string;
}) {
  const toggleSticker = useAlbumStore((state) => state.toggleSticker);
  const incrementDuplicate = useAlbumStore(
    (state) => state.incrementDuplicate,
  );
  const decrementDuplicate = useAlbumStore(
    (state) => state.decrementDuplicate,
  );

  const isOwned = sticker.status === "owned";

  function handleControlClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <article
      className={`album-sticker-slot ${
        isOwned ? "album-sticker-owned" : "album-sticker-missing"
      }`}
    >
      <button
        aria-label={`${sticker.code}: ${
          isOwned ? "marcar como faltante" : "marcar como obtenida"
        }`}
        className="album-sticker-toggle"
        onClick={() => toggleSticker(teamCode, sticker.code)}
        type="button"
      >
        <div className="album-sticker-art">
          <span>{teamCode}</span>
          <strong>{sticker.number}</strong>
        </div>

        <div className="album-sticker-meta">
          <strong>{sticker.code}</strong>
          <span>{isOwned ? "La tengo" : "Me falta"}</span>
          <small>
            {isOwned
              ? "Pulsa para marcar faltante"
              : "Pulsa para agregar"}
          </small>
        </div>
      </button>

      <div className="duplicate-control">
        <span>Repetidas</span>

        <div>
          <button
            aria-label={`Quitar repetida de ${sticker.code}`}
            disabled={!isOwned || sticker.duplicates === 0}
            onClick={(event) => {
              handleControlClick(event);
              decrementDuplicate(teamCode, sticker.code);
            }}
            type="button"
          >
            <Minus size={13} />
          </button>

          <strong>{sticker.duplicates}</strong>

          <button
            aria-label={`Agregar repetida a ${sticker.code}`}
            onClick={(event) => {
              handleControlClick(event);
              incrementDuplicate(teamCode, sticker.code);
            }}
            type="button"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function AlbumViewer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTeamCode =
    searchParams.get("team")?.trim().toUpperCase() ??
    DEFAULT_TEAM_CODE;

  const teams = useAlbumStore((state) => state.teams);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);
  const resetCollection = useAlbumStore((state) => state.resetCollection);
  const toggleSticker = useAlbumStore((state) => state.toggleSticker);

  const requestedIndex = useMemo(() => {
    const foundIndex = teams.findIndex(
      (team) => team.code === requestedTeamCode,
    );

    if (foundIndex >= 0) {
      return foundIndex;
    }

    const defaultIndex = teams.findIndex(
      (team) => team.code === DEFAULT_TEAM_CODE,
    );

    return defaultIndex >= 0 ? defaultIndex : 0;
  }, [requestedTeamCode, teams]);

  const [turnDirection, setTurnDirection] =
    useState<TurnDirection>("next");

  useEffect(() => {
    void useAlbumStore.persist.rehydrate();
  }, []);

  const safeIndex = Math.max(
    0,
    Math.min(requestedIndex, Math.max(teams.length - 1, 0)),
  );

  const currentTeam = teams[safeIndex];

  const currentGroup = useMemo(
    () =>
      groupData.groups.find(
        (group) => group.id === currentTeam?.group,
      ),
    [currentTeam?.group],
  );

  if (!hasHydrated || !currentTeam || !currentGroup) {
    return (
      <main className="album-page-shell">
        <div className="album-loading">
          <span>ALBUMFIND</span>
          <strong>Cargando tu colección…</strong>
        </div>
      </main>
    );
  }

  const ownedNumbers = currentTeam.stickers
    .filter((sticker) => sticker.status === "owned")
    .map((sticker) => sticker.number);

  const duplicateTotal = currentTeam.stickers.reduce(
    (total, sticker) => total + sticker.duplicates,
    0,
  );

  function goToIndex(index: number, direction: TurnDirection) {
    const nextIndex = Math.max(
      0,
      Math.min(index, teams.length - 1),
    );

    const nextTeam = teams[nextIndex];

    setTurnDirection(direction);

    router.replace(
      `/album?team=${encodeURIComponent(nextTeam.code)}`,
      { scroll: false },
    );
  }

  function goPrevious() {
    if (safeIndex > 0) {
      goToIndex(safeIndex - 1, "previous");
    }
  }

  function goNext() {
    if (safeIndex < teams.length - 1) {
      goToIndex(safeIndex + 1, "next");
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      "¿Restaurar el inventario inicial? Se eliminarán los cambios guardados en este navegador.",
    );

    if (confirmed) {
      resetCollection();
    }
  }

  return (
    <main className="album-page-shell album-page-editorial">
      <header className="album-toolbar">
        <Link className="album-back-link" href="/">
          <ArrowLeft size={18} />
          Volver al resumen
        </Link>

        <div className="album-toolbar-title">
          <span>ALBUMFIND</span>
          <strong>Álbum Mundial 2026</strong>
        </div>

        <div className="album-toolbar-actions">
          <button onClick={handleReset} type="button">
            <RotateCcw size={15} />
            Restaurar
          </button>

          <div className="album-position">
            <Grid3X3 size={17} />
            {safeIndex + 1} de {teams.length}
          </div>
        </div>
      </header>

      <section className="album-stage album-editorial-workspace">
        <div className="album-stage-heading">
          <div>
            <p>Grupo {currentTeam.group}</p>
            <h1>{currentTeam.name}</h1>
          </div>

          <div className="album-team-summary">
            <span>
              <strong>{currentTeam.ownedCount}</strong> tengo
            </span>

            <span>
              <strong>{currentTeam.missingCount}</strong> faltan
            </span>

            <span>
              <strong>{duplicateTotal}</strong> repetidas
            </span>
          </div>
        </div>

        <div
          className={`album-editorial-book album-turn-${turnDirection}`}
          key={`${currentTeam.code}-${turnDirection}`}
        >
          <TeamSpread
            group={currentTeam.group}
            groupTeams={currentGroup.teams}
            onToggleSticker={(stickerCode) =>
              toggleSticker(currentTeam.code, stickerCode)
            }
            ownedCount={currentTeam.ownedCount}
            ownedNumbers={ownedNumbers}
            teamCode={currentTeam.code}
            teamName={currentTeam.name}
            totalCount={currentTeam.stickers.length}
          />
        </div>

        <nav className="album-navigation" aria-label="Navegación del álbum">
          <button
            disabled={safeIndex === 0}
            onClick={goPrevious}
            type="button"
          >
            <ChevronLeft size={19} />
            Anterior
          </button>

          <select
            aria-label="Seleccionar equipo"
            onChange={(event) => {
              const nextIndex = Number(event.target.value);

              const direction: TurnDirection =
                nextIndex >= safeIndex ? "next" : "previous";

              goToIndex(nextIndex, direction);
            }}
            value={safeIndex}
          >
            {teams.map((team, index) => (
              <option key={team.code} value={index}>
                Grupo {team.group} · {team.name}
              </option>
            ))}
          </select>

          <button
            disabled={safeIndex === teams.length - 1}
            onClick={goNext}
            type="button"
          >
            Siguiente
            <ChevronRight size={19} />
          </button>
        </nav>

        <section className="album-collection-editor">
          <div className="album-collection-editor-heading">
            <div>
              <span>Gestión de colección</span>
              <h2>Láminas de {currentTeam.name}</h2>
            </div>

            <p>
              Marca las láminas obtenidas y administra las repetidas.
              Los cambios se reflejan inmediatamente en el álbum.
            </p>
          </div>

          <div className="album-sticker-grid album-collection-editor-grid">
            {currentTeam.stickers.map((sticker) => (
              <StickerSlot
                key={sticker.code}
                sticker={sticker}
                teamCode={currentTeam.code}
              />
            ))}
          </div>
        </section>

        <p className="album-save-message">
          Los cambios se guardan automáticamente en este navegador.
        </p>
      </section>
    </main>
  );
}


