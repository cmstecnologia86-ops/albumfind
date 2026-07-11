"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TeamSpread from "@/components/album/TeamSpread";
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
const DEFAULT_TEAM_CODE = "MEX";

export default function AlbumPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const teams = useAlbumStore((state) => state.teams);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);

  useEffect(() => {
    void useAlbumStore.persist.rehydrate();
  }, []);

  const requestedTeamCode =
    searchParams.get("team")?.trim().toUpperCase() ??
    DEFAULT_TEAM_CODE;

  const selectedTeamIndex = useMemo(() => {
    const requestedIndex = teams.findIndex(
      (team) => team.code === requestedTeamCode,
    );

    if (requestedIndex >= 0) {
      return requestedIndex;
    }

    const defaultIndex = teams.findIndex(
      (team) => team.code === DEFAULT_TEAM_CODE,
    );

    return defaultIndex >= 0 ? defaultIndex : 0;
  }, [requestedTeamCode, teams]);

  const selectedTeam = teams[selectedTeamIndex];

  const selectedGroup = useMemo(
    () =>
      groupData.groups.find(
        (group) => group.id === selectedTeam?.group,
      ),
    [selectedTeam?.group],
  );

  const navigateToTeam = (teamCode: string) => {
    router.push(
      `/album-preview?team=${encodeURIComponent(teamCode)}`,
    );
  };

  if (!hasHydrated || !selectedTeam || !selectedGroup) {
    return (
      <div className="album-loading">
        <span>ALBUMFIND</span>
        <strong>Cargando la colección real…</strong>
      </div>
    );
  }

  const previousIndex =
    (selectedTeamIndex - 1 + teams.length) % teams.length;

  const nextIndex =
    (selectedTeamIndex + 1) % teams.length;

  const previousTeam = teams[previousIndex];
  const nextTeam = teams[nextIndex];

  const ownedNumbers = selectedTeam.stickers
    .filter((sticker) => sticker.status === "owned")
    .map((sticker) => sticker.number);

  return (
    <>
      <nav
        aria-label="Navegación entre selecciones"
        className="album-preview-team-nav"
      >
        <button
          onClick={() => navigateToTeam(previousTeam.code)}
          type="button"
        >
          <span>Anterior</span>
          <strong>
            {previousTeam.code} · {previousTeam.name}
          </strong>
        </button>

        <label>
          <span>Selección activa</span>

          <select
            aria-label="Seleccionar equipo"
            onChange={(event) =>
              navigateToTeam(event.target.value)
            }
            value={selectedTeam.code}
          >
            {teams.map((team) => (
              <option key={team.code} value={team.code}>
                {team.code} · {team.name} · Grupo {team.group}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => navigateToTeam(nextTeam.code)}
          type="button"
        >
          <span>Siguiente</span>
          <strong>
            {nextTeam.code} · {nextTeam.name}
          </strong>
        </button>
      </nav>

      <TeamSpread
        group={selectedTeam.group}
        groupTeams={selectedGroup.teams}
        ownedCount={selectedTeam.ownedCount}
        ownedNumbers={ownedNumbers}
        teamCode={selectedTeam.code}
        teamName={selectedTeam.name}
        totalCount={selectedTeam.stickers.length}
      />
    </>
  );
}
