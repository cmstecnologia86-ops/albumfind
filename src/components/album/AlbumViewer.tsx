"use client";

import type { CSSProperties, MouseEvent } from "react";

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
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  type Sticker,
  useAlbumStore,
} from "@/store/useAlbumStore";

const groupColors: Record<string, string> = {
  A: "#19b7a2",
  B: "#f45d48",
  C: "#74b941",
  D: "#445ee6",
  E: "#f3913f",
  F: "#e45f50",
  G: "#6b63d8",
  H: "#cf5558",
  I: "#7551d5",
  J: "#54a769",
  K: "#efbf2f",
  L: "#5ea6cf",
};

type TurnDirection = "next" | "previous";

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
  const searchParams = useSearchParams();
  const requestedTeam = searchParams.get("team")?.toUpperCase();

  const teams = useAlbumStore((state) => state.teams);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);
  const resetCollection = useAlbumStore((state) => state.resetCollection);

  const initialIndex = useMemo(() => {
    if (!requestedTeam) {
      return 0;
    }

    const foundIndex = teams.findIndex(
      (team) => team.code === requestedTeam,
    );

    return foundIndex >= 0 ? foundIndex : 0;
  }, [requestedTeam, teams]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [turnDirection, setTurnDirection] =
    useState<TurnDirection>("next");

  useEffect(() => {
    void useAlbumStore.persist.rehydrate();
  }, []);


  if (!hasHydrated) {
    return (
      <main className="album-page-shell">
        <div className="album-loading">
          <span>ALBUMFIND</span>
          <strong>Cargando tu colección…</strong>
        </div>
      </main>
    );
  }

  const safeIndex = Math.min(currentIndex, teams.length - 1);
  const currentTeam = teams[safeIndex];
  const leftStickers = currentTeam.stickers.slice(0, 10);
  const rightStickers = currentTeam.stickers.slice(10, 20);
  const accent = groupColors[currentTeam.group] ?? "#7657ff";

  const duplicateTotal = currentTeam.stickers.reduce(
    (total, sticker) => total + sticker.duplicates,
    0,
  );

  function goToIndex(index: number, direction: TurnDirection) {
    const nextIndex = Math.max(
      0,
      Math.min(index, teams.length - 1),
    );

    setTurnDirection(direction);
    setCurrentIndex(nextIndex);
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
      setCurrentIndex(initialIndex);
    }
  }

  return (
    <main
      className="album-page-shell"
      style={{ "--album-accent": accent } as CSSProperties}
    >
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

      <section className="album-stage">
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
          className={`album-book album-turn-${turnDirection}`}
          key={`${currentTeam.code}-${turnDirection}`}
        >
          <section className="album-sheet album-sheet-left">
            <div className="album-team-header">
              <span className="album-team-code">{currentTeam.code}</span>

              <div>
                <small>WE ARE</small>
                <strong>{currentTeam.name.toUpperCase()}</strong>
              </div>
            </div>

            <div className="album-sticker-grid">
              {leftStickers.map((sticker) => (
                <StickerSlot
                  key={sticker.code}
                  sticker={sticker}
                  teamCode={currentTeam.code}
                />
              ))}
            </div>

            <div className="album-page-number">
              Página {safeIndex * 2 + 1}
            </div>
          </section>

          <div className="album-spine" aria-hidden="true" />

          <section className="album-sheet album-sheet-right">
            <div className="album-team-header album-team-header-right">
              <div>
                <small>GRUPO {currentTeam.group}</small>
                <strong>20 LÁMINAS</strong>
              </div>

              <span className="album-team-code">{currentTeam.code}</span>
            </div>

            <div className="album-sticker-grid">
              {rightStickers.map((sticker) => (
                <StickerSlot
                  key={sticker.code}
                  sticker={sticker}
                  teamCode={currentTeam.code}
                />
              ))}
            </div>

            <div className="album-page-number album-page-number-right">
              Página {safeIndex * 2 + 2}
            </div>
          </section>

          <button
            aria-label="Selección anterior"
            className="album-corner-control album-corner-left"
            disabled={safeIndex === 0}
            onClick={goPrevious}
            type="button"
          >
            <ChevronLeft size={29} />
          </button>

          <button
            aria-label="Selección siguiente"
            className="album-corner-control album-corner-right"
            disabled={safeIndex === teams.length - 1}
            onClick={goNext}
            type="button"
          >
            <ChevronRight size={29} />
          </button>
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

        <p className="album-save-message">
          Los cambios se guardan automáticamente en este navegador.
        </p>
      </section>
    </main>
  );
}

