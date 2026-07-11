"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Copy,
  Layers3,
} from "lucide-react";
import { useEffect, useMemo } from "react";

import groupsSource from "@/data/groups.json";
import { useAlbumStore } from "@/store/useAlbumStore";

type GroupData = {
  groups: Array<{
    id: string;
    teams: Array<{
      code: string;
      name: string;
    }>;
  }>;
};

const groupData = groupsSource as GroupData;
const numberFormatter = new Intl.NumberFormat("es-CL");

function calculatePercentage(owned: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((owned / total) * 100);
}

function calculateExactPercentage(owned: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((owned / total) * 100).toFixed(2));
}

function getProgressTone(value: number) {
  if (value >= 75) {
    return "progress-high";
  }

  if (value >= 45) {
    return "progress-medium";
  }

  return "progress-low";
}

export default function DashboardClient() {
  const teams = useAlbumStore((state) => state.teams);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);

  useEffect(() => {
    void useAlbumStore.persist.rehydrate();
  }, []);

  const totals = useMemo(() => {
    const stickers = teams.flatMap((team) => team.stickers);
    const totalStickers = stickers.length;

    const owned = stickers.filter(
      (sticker) => sticker.status === "owned",
    ).length;

    const missing = totalStickers - owned;

    const duplicates = stickers.reduce(
      (total, sticker) => total + sticker.duplicates,
      0,
    );

    return {
      teams: teams.length,
      stickers: totalStickers,
      owned,
      missing,
      duplicates,
      completionPercentage: calculateExactPercentage(
        owned,
        totalStickers,
      ),
    };
  }, [teams]);

  if (!hasHydrated) {
    return (
      <main className="app-shell">
        <div className="dashboard-loading">
          <span>ALBUMFIND</span>
          <strong>Cargando tu colección…</strong>
        </div>
      </main>
    );
  }

  const teamsByCode = new Map(
    teams.map((team) => [team.code, team]),
  );

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <p className="brand-name">
              ALBUM<span>FIND</span>
            </p>

            <p className="brand-subtitle">
              Tu álbum inteligente · Mundial 2026
            </p>
          </div>
        </div>

        <div className="topbar-progress">
          <div className="topbar-progress-copy">
            <span>Progreso general</span>
            <strong>{totals.completionPercentage}%</strong>
          </div>

          <div className="progress-track progress-track-large">
            <span
              className="progress-fill"
              style={{
                width: `${totals.completionPercentage}%`,
              }}
            />
          </div>
        </div>

        <Link className="primary-action" href="/album">
          <BookOpen size={18} strokeWidth={2.2} />
          Abrir álbum
        </Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Colección personal</p>

          <h1>
            Tu camino para completar
            <span> el álbum del Mundial.</span>
          </h1>

          <p className="hero-description">
            Controla cada selección, identifica tus faltantes y administra
            tus láminas repetidas desde un mismo inventario.
          </p>
        </div>

        <div
          className="completion-ring"
          style={{
            background: `
              radial-gradient(
                circle closest-side,
                #111526 78%,
                transparent 80% 99%
              ),
              conic-gradient(
                var(--lime) 0 ${totals.completionPercentage}%,
                rgba(255, 255, 255, 0.08)
                  ${totals.completionPercentage}% 100%
              )
            `,
          }}
        >
          <div className="completion-ring-inner">
            <strong>{totals.completionPercentage}%</strong>
            <span>completado</span>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Resumen de colección">
        <article className="stat-card stat-card-owned">
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>

          <div>
            <span className="stat-label">Tengo</span>
            <strong>{numberFormatter.format(totals.owned)}</strong>
            <small>Láminas incorporadas</small>
          </div>
        </article>

        <article className="stat-card stat-card-missing">
          <div className="stat-icon">
            <CircleDashed size={24} />
          </div>

          <div>
            <span className="stat-label">Me faltan</span>
            <strong>{numberFormatter.format(totals.missing)}</strong>
            <small>Láminas pendientes</small>
          </div>
        </article>

        <article className="stat-card stat-card-duplicates">
          <div className="stat-icon">
            <Copy size={24} />
          </div>

          <div>
            <span className="stat-label">Repetidas</span>
            <strong>{numberFormatter.format(totals.duplicates)}</strong>
            <small>Disponibles para intercambio</small>
          </div>
        </article>

        <article className="stat-card stat-card-total">
          <div className="stat-icon">
            <Layers3 size={24} />
          </div>

          <div>
            <span className="stat-label">Total equipos</span>
            <strong>{totals.teams}</strong>
            <small>
              {numberFormatter.format(totals.stickers)} láminas
            </small>
          </div>
        </article>
      </section>

      <section className="collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Álbum por grupos</p>
            <h2>Las 48 selecciones</h2>
          </div>

          <p>
            Los indicadores reflejan los cambios guardados en este
            navegador.
          </p>
        </div>

        <div className="groups-list">
          {groupData.groups.map((group) => {
            const groupTeams = group.teams
              .map((team) => teamsByCode.get(team.code))
              .filter((team) => Boolean(team));

            const groupOwned = groupTeams.reduce(
              (total, team) => total + (team?.ownedCount ?? 0),
              0,
            );

            const groupTotal = groupTeams.reduce(
              (total, team) =>
                total + (team?.stickers.length ?? 0),
              0,
            );

            const groupPercentage = calculatePercentage(
              groupOwned,
              groupTotal,
            );

            return (
              <section className="group-panel" key={group.id}>
                <div className="group-heading">
                  <div className="group-badge">
                    Grupo {group.id}
                  </div>

                  <div className="group-summary">
                    <strong>{groupPercentage}%</strong>
                    <span>
                      {groupOwned} de {groupTotal}
                    </span>
                  </div>
                </div>

                <div className="team-grid">
                  {groupTeams.map((team) => {
                    if (!team) {
                      return null;
                    }

                    const teamPercentage = calculatePercentage(
                      team.ownedCount,
                      team.stickers.length,
                    );

                    const duplicateCount = team.stickers.reduce(
                      (total, sticker) =>
                        total + sticker.duplicates,
                      0,
                    );

                    return (
                      <article className="team-card" key={team.code}>
                        <div className="team-card-top">
                          <div className="team-code">{team.code}</div>

                          <span
                            className={getProgressTone(teamPercentage)}
                          >
                            {teamPercentage}%
                          </span>
                        </div>

                        <div className="team-copy">
                          <h3>{team.name}</h3>

                          <p>
                            <strong>{team.ownedCount}</strong> tengo
                            <span>·</span>
                            <strong>{team.missingCount}</strong> faltan
                          </p>

                          {duplicateCount > 0 && (
                            <p className="team-duplicates">
                              {duplicateCount} repetidas
                            </p>
                          )}
                        </div>

                        <div className="progress-track">
                          <span
                            className="progress-fill"
                            style={{ width: `${teamPercentage}%` }}
                          />
                        </div>

                        <div
                          className="sticker-dots"
                          aria-label={`Estado de láminas de ${team.name}`}
                        >
                          {team.stickers.map((sticker) => (
                            <span
                              className={
                                sticker.status === "owned"
                                  ? "sticker-dot sticker-dot-owned"
                                  : "sticker-dot"
                              }
                              key={sticker.code}
                              title={`${sticker.code}: ${
                                sticker.status === "owned"
                                  ? "La tengo"
                                  : "Me falta"
                              }`}
                            />
                          ))}
                        </div>

                        <Link
                          className="team-action"
                          href={`/album?team=${team.code}`}
                        >
                          Ver selección
                          <span aria-hidden="true">→</span>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
