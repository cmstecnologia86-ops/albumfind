"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import collectionSource from "@/data/my-collection.json";

type StickerStatus = "owned" | "missing";

type Sticker = {
  code: string;
  number: number;
  status: StickerStatus;
  duplicates: number;
};

type Team = {
  code: string;
  name: string;
  group: string;
  ownedCount: number;
  missingCount: number;
  stickers: Sticker[];
};

type CollectionData = {
  totals: {
    teams: number;
    stickers: number;
    owned: number;
    missing: number;
    duplicates: number;
    completionPercentage: number;
  };
  teams: Team[];
};

const collection = collectionSource as CollectionData;

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

function clampIndex(index: number) {
  return Math.max(0, Math.min(index, collection.teams.length - 1));
}

export default function AlbumViewer() {
  const searchParams = useSearchParams();
  const requestedTeam = searchParams.get("team")?.toUpperCase();

  const initialIndex = useMemo(() => {
    if (!requestedTeam) {
      return 0;
    }

    const foundIndex = collection.teams.findIndex(
      (team) => team.code === requestedTeam,
    );

    return foundIndex >= 0 ? foundIndex : 0;
  }, [requestedTeam]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [turnDirection, setTurnDirection] = useState<"next" | "previous">(
    "next",
  );

  const currentTeam = collection.teams[currentIndex];
  const leftStickers = currentTeam.stickers.slice(0, 10);
  const rightStickers = currentTeam.stickers.slice(10, 20);
  const accent = groupColors[currentTeam.group] ?? "#7657ff";

  function goToIndex(index: number, direction: "next" | "previous") {
    setTurnDirection(direction);
    setCurrentIndex(clampIndex(index));
  }

  function goPrevious() {
    if (currentIndex === 0) {
      return;
    }

    goToIndex(currentIndex - 1, "previous");
  }

  function goNext() {
    if (currentIndex === collection.teams.length - 1) {
      return;
    }

    goToIndex(currentIndex + 1, "next");
  }

  return (
    <main
      className="album-page-shell"
      style={{ "--album-accent": accent } as React.CSSProperties}
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

        <div className="album-position">
          <Grid3X3 size={17} />
          {currentIndex + 1} de {collection.teams.length}
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
          </div>
        </div>

        <div
          className={`album-book album-turn-${turnDirection}`}
          key={currentTeam.code}
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
                <article
                  className={`album-sticker-slot ${
                    sticker.status === "owned"
                      ? "album-sticker-owned"
                      : "album-sticker-missing"
                  }`}
                  key={sticker.code}
                >
                  <div className="album-sticker-art">
                    <span>{currentTeam.code}</span>
                    <strong>{sticker.number}</strong>
                  </div>

                  <div className="album-sticker-meta">
                    <strong>{sticker.code}</strong>
                    <span>
                      {sticker.status === "owned" ? "La tengo" : "Me falta"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="album-page-number">
              Página {currentIndex * 2 + 1}
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
                <article
                  className={`album-sticker-slot ${
                    sticker.status === "owned"
                      ? "album-sticker-owned"
                      : "album-sticker-missing"
                  }`}
                  key={sticker.code}
                >
                  <div className="album-sticker-art">
                    <span>{currentTeam.code}</span>
                    <strong>{sticker.number}</strong>
                  </div>

                  <div className="album-sticker-meta">
                    <strong>{sticker.code}</strong>
                    <span>
                      {sticker.status === "owned" ? "La tengo" : "Me falta"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="album-page-number album-page-number-right">
              Página {currentIndex * 2 + 2}
            </div>
          </section>

          <button
            aria-label="Selección anterior"
            className="album-corner-control album-corner-left"
            disabled={currentIndex === 0}
            onClick={goPrevious}
            type="button"
          >
            <ChevronLeft size={29} />
          </button>

          <button
            aria-label="Selección siguiente"
            className="album-corner-control album-corner-right"
            disabled={currentIndex === collection.teams.length - 1}
            onClick={goNext}
            type="button"
          >
            <ChevronRight size={29} />
          </button>
        </div>

        <nav className="album-navigation" aria-label="Navegación del álbum">
          <button
            disabled={currentIndex === 0}
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
              const direction =
                nextIndex >= currentIndex ? "next" : "previous";

              goToIndex(nextIndex, direction);
            }}
            value={currentIndex}
          >
            {collection.teams.map((team, index) => (
              <option key={team.code} value={index}>
                Grupo {team.group} · {team.name}
              </option>
            ))}
          </select>

          <button
            disabled={currentIndex === collection.teams.length - 1}
            onClick={goNext}
            type="button"
          >
            Siguiente
            <ChevronRight size={19} />
          </button>
        </nav>
      </section>
    </main>
  );
}
