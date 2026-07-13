import Image from "next/image";

import {
  getTeamTheme,
  getTeamThemeCssVariables,
} from "@/data/team-themes";
import { getPlayerCatalogTeam } from "@/data/player-catalog";
import { getStickerImagePath } from "@/data/sticker-image-manifest";

type GroupTeam = {
  code: string;
  name: string;
};

type TeamSpreadProps = {
  teamCode: string;
  teamName: string;
  group: string;
  groupTeams: GroupTeam[];
  ownedCount: number;
  totalCount: number;
  ownedNumbers?: number[];
  onToggleSticker?: (stickerCode: string) => void;
};

type PreviewStickerKind = "crest" | "player" | "squad";

type PreviewSticker = {
  number: number;
  code: string;
  name: string;
  owned: boolean;
  kind: PreviewStickerKind;
  image?: string;
};

function buildPreviewStickers(
  teamCode: string,
  teamName: string,
  ownedNumbers: number[],
): PreviewSticker[] {
  const catalogTeam = getPlayerCatalogTeam(teamCode);
  const catalogStickersByNumber = new Map(
    catalogTeam?.stickers.map((sticker) => [
      sticker.number,
      sticker,
    ]) ?? [],
  );

  return Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    const paddedNumber = String(number).padStart(2, "0");
    const catalogSticker =
      catalogStickersByNumber.get(number);

    const kind: PreviewStickerKind =
      catalogSticker?.kind === "emblem"
        ? "crest"
        : catalogSticker?.kind === "squad"
          ? "squad"
          : "player";

    const fallbackName =
      number === 1
        ? `Emblema de ${teamName}`
        : number === 13
          ? `Foto de equipo de ${teamName}`
          : `Jugador ${paddedNumber}`;

    return {
      code:
        catalogSticker?.code ??
        `${teamCode}-${paddedNumber}`,
      image: getStickerImagePath(teamCode, number),
      kind,
      name: catalogSticker?.name ?? fallbackName,
      number,
      owned: ownedNumbers.includes(number),
    };
  });
}
function StickerPreviewCard({
  sticker,
  teamCode,
  teamName,
  flag,
  onToggleSticker,
}: {
  sticker: PreviewSticker;
  teamCode: string;
  teamName: string;
  flag: string;
  onToggleSticker?: (stickerCode: string) => void;
}) {
  const showRealImage =
    sticker.owned &&
    Boolean(sticker.image);

  const realImage =
    showRealImage && sticker.image ? (
      <Image
        alt={sticker.name}
        className="editorial-real-sticker-image"
        fill
        sizes={
          sticker.kind === "squad"
            ? "256px"
            : "192px"
        }
        src={sticker.image}
        unoptimized
      />
    ) : null;

  const className = [
    "editorial-sticker",
    sticker.kind === "squad"
      ? "editorial-sticker-squad"
      : sticker.kind === "crest"
        ? "editorial-sticker-crest"
        : "editorial-sticker-player",
    sticker.owned ? "owned" : "missing",
    onToggleSticker ? "editorial-sticker-interactive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (sticker.kind === "crest") {
    return (
      <button
        aria-label={`${sticker.code}: ${
          sticker.owned
            ? "marcar como faltante"
            : "marcar como obtenida"
        }`}
        aria-pressed={sticker.owned}
        className={className}
        onClick={() => onToggleSticker?.(sticker.code)}
        tabIndex={onToggleSticker ? 0 : -1}
        type="button"
      >
        <div
          className={[
            "editorial-sticker-top",
            "editorial-crest-top",
            showRealImage
              ? "editorial-sticker-top-with-image"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {realImage ?? (
            <div className="editorial-crest-inner">
              <Image
                alt={`Bandera de ${teamName}`}
                height={34}
                src={flag}
                style={{
                  height: 34,
                  width: 50,
                }}
                width={50}
              />
            </div>
          )}
        </div>

        <div className="editorial-sticker-body editorial-crest-body">
          <span>{sticker.name}</span>
          <small>{sticker.code}</small>
        </div>

        {sticker.owned && (
          <span className="editorial-sticker-check" aria-hidden="true">
            ✓
          </span>
        )}
      </button>
    );
  }

  if (sticker.kind === "squad") {
    return (
      <button
        aria-label={`${sticker.code}: ${
          sticker.owned
            ? "marcar como faltante"
            : "marcar como obtenida"
        }`}
        aria-pressed={sticker.owned}
        className={className}
        onClick={() => onToggleSticker?.(sticker.code)}
        tabIndex={onToggleSticker ? 0 : -1}
        type="button"
      >
        <div
          className={[
            "editorial-sticker-top",
            showRealImage
              ? "editorial-sticker-top-with-image"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {realImage ?? (
            <>
              <span>{teamCode}</span>
              <strong>13</strong>
            </>
          )}
        </div>

        <div className="editorial-sticker-body">
          <span>{sticker.name}</span>
          <small>{sticker.code}</small>
        </div>

        {sticker.owned && (
          <span className="editorial-sticker-check" aria-hidden="true">
            ✓
          </span>
        )}
      </button>
    );
  }

  return (
    <button
        aria-label={`${sticker.code}: ${
          sticker.owned
            ? "marcar como faltante"
            : "marcar como obtenida"
        }`}
        aria-pressed={sticker.owned}
        className={className}
        onClick={() => onToggleSticker?.(sticker.code)}
        tabIndex={onToggleSticker ? 0 : -1}
        type="button"
      >
      <div
        className={[
          "editorial-sticker-top",
          showRealImage
            ? "editorial-sticker-top-with-image"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {realImage ?? (
          <>
            <span>{teamCode}</span>
            <strong>
              {String(sticker.number).padStart(2, "0")}
            </strong>
          </>
        )}
      </div>

      <div className="editorial-sticker-body">
        <span>{sticker.name}</span>
        <small>{sticker.code}</small>
      </div>

      {sticker.owned && (
        <span className="editorial-sticker-check" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  );
}

export default function TeamSpread({
  teamCode,
  teamName,
  group,
  groupTeams,
  ownedCount,
  totalCount,
  ownedNumbers = [],
  onToggleSticker,
}: TeamSpreadProps) {
  const theme = getTeamTheme(teamCode, teamName);
  const stickers = buildPreviewStickers(teamCode, teamName, ownedNumbers);
  const missingCount = totalCount - ownedCount;

  const completionPercentage =
    totalCount === 0
      ? 0
      : Math.round((ownedCount / totalCount) * 100);

  const stickerByNumber = new Map(
    stickers.map((sticker) => [sticker.number, sticker]),
  );

  function renderSticker(number: number) {
    const sticker = stickerByNumber.get(number);

    if (!sticker) {
      return null;
    }

    return (
      <StickerPreviewCard
        key={sticker.code}
        flag={theme.flag}
        onToggleSticker={onToggleSticker}
        sticker={sticker}
        teamCode={teamCode}
        teamName={teamName}
      />
    );
  }

  return (
    <section
      className={`editorial-spread editorial-spread-${teamCode.toLowerCase()}`}
      style={getTeamThemeCssVariables(theme)}
    >
      <div className="editorial-book-shadow" aria-hidden="true" />
      <div className="editorial-book-spine" aria-hidden="true" />

      <div className="editorial-page editorial-page-left">
        <div className="editorial-page-pattern" />

        <header className="editorial-hero-block">
          <div className="editorial-title-block">
            <span>{theme.identity.eyebrow}</span>

            <h1
              className={[
                "editorial-team-title",
                teamName.length >= 19
                  ? "editorial-team-title-long"
                  : teamName.length >= 11
                    ? "editorial-team-title-medium"
                    : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <small>We are</small>
              {teamName}
            </h1>

            <p>{theme.identity.slogan}</p>
          </div>

          <div className="editorial-association editorial-association-text">
            <span>{theme.identity.association}</span>
          </div>
        </header>

        <div className="editorial-sticker-zone editorial-sticker-zone-left">
          <div className="editorial-row editorial-row-four">
            {[1, 2, 3, 4].map(renderSticker)}
          </div>

          <div className="editorial-row editorial-row-three">
            {[5, 6, 7].map(renderSticker)}
          </div>

          <div className="editorial-row editorial-row-three">
            {[8, 9, 10].map(renderSticker)}
          </div>
        </div>

        <footer className="editorial-note-panel">
          <div className="editorial-roadto">
            <strong>ROAD TO</strong>
            <span>WORLD CUP 2026</span>
          </div>

          <p>
            Identidad editorial de {teamName} y distribución
              corregida de sus láminas dentro de la colección ALBUMFIND.
          </p>
        </footer>

        <span className="editorial-page-number">Página 1</span>
      </div>

      <div className="editorial-page editorial-page-right">
        <div className="editorial-page-pattern" />

        <div className="editorial-progress-panel">
          <div>
            <span>Tengo</span>
            <strong>{ownedCount}</strong>
          </div>

          <div>
            <span>Me faltan</span>
            <strong>{missingCount}</strong>
          </div>

          <div>
            <span>Progreso</span>
            <strong>{completionPercentage}%</strong>
          </div>
        </div>

        <div className="editorial-sticker-zone editorial-sticker-zone-right">
          <div className="editorial-row editorial-row-top-mixed">
            {renderSticker(11)}
            {renderSticker(12)}
            {renderSticker(13)}
          </div>

          <div className="editorial-row editorial-row-four">
            {[14, 15, 16, 17].map(renderSticker)}
          </div>

          <div className="editorial-row editorial-row-three editorial-row-last">
            {[18, 19, 20].map(renderSticker)}
          </div>
        </div>

        <aside className="editorial-group-panel editorial-group-panel-wide">
          <div className="editorial-group-table">
            {groupTeams.map((groupTeam) => (
              <div
                className={
                  groupTeam.code === teamCode
                    ? "editorial-group-table-row active"
                    : "editorial-group-table-row"
                }
                key={groupTeam.code}
              >
                <strong>{groupTeam.code}</strong>

                <Image
                  alt={`Bandera de ${groupTeam.name}`}
                  height={20}
                  src={`/flags/${groupTeam.code}.png`}
                  style={{ height: 20, width: 30 }}
                  width={30}
                />

                <span>{groupTeam.name}</span>
              </div>
            ))}
          </div>

          <div className="editorial-group-letter">
            <span>Grupo</span>
            <strong>{group}</strong>
          </div>
        </aside>

        <span className="editorial-page-number">Página 2</span>
      </div>
    </section>
  );
}














