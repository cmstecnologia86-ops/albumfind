"use client";

import { useEffect, useMemo } from "react";

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

export default function AlbumPreviewClient() {
  const teams = useAlbumStore((state) => state.teams);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);

  useEffect(() => {
    void useAlbumStore.persist.rehydrate();
  }, []);

  const mexico = useMemo(
    () => teams.find((team) => team.code === "MEX"),
    [teams],
  );

  const mexicoGroup = useMemo(
    () =>
      groupData.groups.find(
        (group) => group.id === mexico?.group,
      ),
    [mexico?.group],
  );

  if (!hasHydrated || !mexico || !mexicoGroup) {
    return (
      <div className="album-loading">
        <span>ALBUMFIND</span>
        <strong>Cargando la colección real…</strong>
      </div>
    );
  }

  const ownedNumbers = mexico.stickers
    .filter((sticker) => sticker.status === "owned")
    .map((sticker) => sticker.number);

  return (
    <TeamSpread
      group={mexico.group}
      groupTeams={mexicoGroup.teams}
      ownedCount={mexico.ownedCount}
      ownedNumbers={ownedNumbers}
      teamCode={mexico.code}
      teamName={mexico.name}
      totalCount={mexico.stickers.length}
    />
  );
}
