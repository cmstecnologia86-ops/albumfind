import playerCatalogJson from "@/data/player-catalog.json";

export type PlayerCatalogStickerKind =
  | "emblem"
  | "player"
  | "squad";

export type PlayerCatalogSticker = {
  code: string;
  number: number;
  teamCode: string;
  kind: PlayerCatalogStickerKind;
  name: string;
};

export type PlayerCatalogTeam = {
  teamCode: string;
  teamName: string;
  stickers: PlayerCatalogSticker[];
};

type PlayerCatalog = {
  version: string;
  schema: string;
  teamCount: number;
  stickersPerTeam: number;
  totalStickers: number;
  teams: PlayerCatalogTeam[];
};

const playerCatalog = playerCatalogJson as PlayerCatalog;

const teamsByCode = new Map(
  playerCatalog.teams.map((team) => [
    team.teamCode.toUpperCase(),
    team,
  ]),
);

export function getPlayerCatalogTeam(
  teamCode: string,
): PlayerCatalogTeam | undefined {
  return teamsByCode.get(teamCode.toUpperCase());
}

export function getPlayerCatalogSticker(
  stickerCode: string,
): PlayerCatalogSticker | undefined {
  const separatorIndex = stickerCode.lastIndexOf("-");

  if (separatorIndex === -1) {
    return undefined;
  }

  const teamCode = stickerCode.slice(0, separatorIndex);
  const team = getPlayerCatalogTeam(teamCode);

  return team?.stickers.find(
    (sticker) => sticker.code === stickerCode,
  );
}

export { playerCatalog };
