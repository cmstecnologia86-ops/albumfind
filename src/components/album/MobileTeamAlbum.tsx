"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import groupsSource from "@/data/groups.json";
import { getPlayerCatalogTeam } from "@/data/player-catalog";
import { getStickerImagePath } from "@/data/sticker-image-manifest";
import type { Sticker } from "@/store/useAlbumStore";

import styles from "./MobileTeamAlbum.module.css";

type MobileTeamAlbumProps = {
  teamCode: string;
  teamName: string;
  group: string;
  stickers: Sticker[];
  ownedCount: number;
  missingCount: number;
  duplicateTotal: number;
  onToggleSticker: (stickerCode: string) => void;
  onIncrementDuplicate: (stickerCode: string) => void;
  onDecrementDuplicate: (stickerCode: string) => void;
};

type GroupSource = {
  groups: Array<{
    id: string;
    teams: Array<{
      code: string;
      name: string;
    }>;
  }>;
};

const mobileTeams = (groupsSource as GroupSource).groups.flatMap((group) =>
  group.teams.map((team) => ({
    ...team,
    group: group.id,
  })),
);

export default function MobileTeamAlbum({
  teamCode,
  teamName,
  group,
  stickers,
  ownedCount,
  missingCount,
  duplicateTotal,
  onToggleSticker,
  onIncrementDuplicate,
  onDecrementDuplicate,
}: MobileTeamAlbumProps) {
  const router = useRouter();
  const catalogTeam = getPlayerCatalogTeam(teamCode);
  const catalogByNumber = new Map(
    catalogTeam?.stickers.map((sticker) => [sticker.number, sticker]) ?? [],
  );
  const completion = stickers.length
    ? Math.round((ownedCount / stickers.length) * 100)
    : 0;

  useEffect(() => {
    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    const previousBodyOverflowX = document.body.style.overflowX;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousBodyOverscrollX = document.body.style.overscrollBehaviorX;

    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    document.body.style.touchAction = "pan-y";
    document.body.style.overscrollBehaviorX = "none";

    return () => {
      document.documentElement.style.overflowX = previousHtmlOverflowX;
      document.body.style.overflowX = previousBodyOverflowX;
      document.body.style.touchAction = previousBodyTouchAction;
      document.body.style.overscrollBehaviorX = previousBodyOverscrollX;
    };
  }, []);

  function handleTeamChange(nextTeamCode: string) {
    if (nextTeamCode === teamCode) {
      return;
    }

    router.replace(`/album?team=${encodeURIComponent(nextTeamCode)}`, {
      scroll: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className={styles.shell} aria-label={`Álbum móvil de ${teamName}`}>
      <header className={styles.hero}>
        <label className={styles.teamSelector}>
          <span>Cambiar selección</span>
          <select
            aria-label="Seleccionar país"
            onChange={(event) => handleTeamChange(event.target.value)}
            value={teamCode}
          >
            {mobileTeams.map((team) => (
              <option key={team.code} value={team.code}>
                Grupo {team.group} · {team.name}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.heroTop}>
          <div className={styles.identity}>
            <span className={styles.eyebrow}>Álbum móvil · Grupo {group}</span>
            <h2 className={styles.title}>{teamName}</h2>
          </div>
          <div className={styles.groupBadge}>Grupo<br />{group}</div>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span>Tengo</span>
            <strong>{ownedCount}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Me faltan</span>
            <strong>{missingCount}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Progreso</span>
            <strong>{completion}%</strong>
          </div>
        </div>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressBar} style={{ width: `${completion}%` }} />
        </div>
      </header>

      <div className={styles.grid}>
        {stickers.map((sticker) => {
          const isOwned = sticker.status === "owned";
          const catalogSticker = catalogByNumber.get(sticker.number);
          const imagePath = getStickerImagePath(teamCode, sticker.number);
          const displayName = catalogSticker?.name ?? sticker.code;

          return (
            <article
              className={`${styles.card} ${isOwned ? styles.owned : styles.missing}`}
              key={sticker.code}
            >
              <button
                aria-label={`${sticker.code}: ${isOwned ? "marcar como faltante" : "marcar como obtenida"}`}
                aria-pressed={isOwned}
                className={styles.toggle}
                onClick={() => onToggleSticker(sticker.code)}
                type="button"
              >
                <div className={styles.art}>
                  {isOwned && imagePath ? (
                    <Image
                      alt={displayName}
                      className={styles.image}
                      fill
                      sizes="(max-width: 767px) 46vw, 180px"
                      src={imagePath}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.placeholder}>
                      <span>{teamCode}</span>
                      <strong>{String(sticker.number).padStart(2, "0")}</strong>
                    </div>
                  )}
                </div>

                <div className={styles.meta}>
                  <span className={styles.name}>{displayName}</span>
                  <small className={styles.code}>{sticker.code}</small>
                </div>

                {isOwned && <span className={styles.status} aria-hidden="true">✓</span>}
              </button>

              <div className={styles.duplicateRow}>
                <span>Repetidas</span>
                <div className={styles.duplicateControls}>
                  <button
                    aria-label={`Quitar repetida de ${sticker.code}`}
                    disabled={!isOwned || sticker.duplicates === 0}
                    onClick={() => onDecrementDuplicate(sticker.code)}
                    type="button"
                  >
                    <Minus size={13} />
                  </button>
                  <strong>{sticker.duplicates}</strong>
                  <button
                    aria-label={`Agregar repetida a ${sticker.code}`}
                    onClick={() => onIncrementDuplicate(sticker.code)}
                    type="button"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className={styles.hint}>
        Toca una lámina para marcarla como obtenida o faltante. Repetidas actuales: {duplicateTotal}.
      </p>
    </section>
  );
}
