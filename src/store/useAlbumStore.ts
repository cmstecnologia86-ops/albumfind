import { create } from "zustand";
import { persist } from "zustand/middleware";

import collectionSource from "@/data/my-collection.json";

export type StickerStatus = "owned" | "missing";

export type Sticker = {
  code: string;
  number: number;
  status: StickerStatus;
  duplicates: number;
};

export type Team = {
  code: string;
  name: string;
  group: string;
  ownedCount: number;
  missingCount: number;
  stickers: Sticker[];
};

export type CollectionBackup = {
  format: "albumfind-backup";
  version: 1;
  exportedAt: string;
  teams: Team[];
};

type CollectionSource = {
  teams: Team[];
};

type AlbumStore = {
  teams: Team[];
  hasHydrated: boolean;
  lastSavedAt: string | null;
  setHasHydrated: (value: boolean) => void;
  toggleSticker: (teamCode: string, stickerCode: string) => void;
  incrementDuplicate: (teamCode: string, stickerCode: string) => void;
  decrementDuplicate: (teamCode: string, stickerCode: string) => void;
  importCollection: (backup: CollectionBackup) => void;
  resetCollection: () => void;
};

const source = collectionSource as CollectionSource;

function cloneInitialTeams(): Team[] {
  return JSON.parse(JSON.stringify(source.teams)) as Team[];
}

function recalculateTeam(team: Team): Team {
  const ownedCount = team.stickers.filter(
    (sticker) => sticker.status === "owned",
  ).length;

  return {
    ...team,
    ownedCount,
    missingCount: team.stickers.length - ownedCount,
  };
}

function normalizeTeams(teams: Team[]): Team[] {
  return teams.map((team) =>
    recalculateTeam({
      ...team,
      stickers: team.stickers.map((sticker) => ({
        ...sticker,
        status: sticker.status === "owned" ? "owned" : "missing",
        duplicates: Math.max(0, Math.trunc(sticker.duplicates || 0)),
      })),
    }),
  );
}

function nowIso() {
  return new Date().toISOString();
}

export const useAlbumStore = create<AlbumStore>()(
  persist(
    (set) => ({
      teams: cloneInitialTeams(),
      hasHydrated: false,
      lastSavedAt: null,

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },

      toggleSticker: (teamCode, stickerCode) => {
        set((state) => ({
          teams: state.teams.map((team) => {
            if (team.code !== teamCode) {
              return team;
            }

            const stickers = team.stickers.map((sticker) => {
              if (sticker.code !== stickerCode) {
                return sticker;
              }

              const nextStatus: StickerStatus =
                sticker.status === "owned" ? "missing" : "owned";

              return {
                ...sticker,
                status: nextStatus,
                duplicates:
                  nextStatus === "missing" ? 0 : sticker.duplicates,
              };
            });

            return recalculateTeam({
              ...team,
              stickers,
            });
          }),
          lastSavedAt: nowIso(),
        }));
      },

      incrementDuplicate: (teamCode, stickerCode) => {
        set((state) => ({
          teams: state.teams.map((team) => {
            if (team.code !== teamCode) {
              return team;
            }

            const stickers = team.stickers.map((sticker) => {
              if (sticker.code !== stickerCode) {
                return sticker;
              }

              return {
                ...sticker,
                status: "owned" as const,
                duplicates: sticker.duplicates + 1,
              };
            });

            return recalculateTeam({
              ...team,
              stickers,
            });
          }),
          lastSavedAt: nowIso(),
        }));
      },

      decrementDuplicate: (teamCode, stickerCode) => {
        set((state) => ({
          teams: state.teams.map((team) => {
            if (team.code !== teamCode) {
              return team;
            }

            return {
              ...team,
              stickers: team.stickers.map((sticker) => {
                if (sticker.code !== stickerCode) {
                  return sticker;
                }

                return {
                  ...sticker,
                  duplicates: Math.max(0, sticker.duplicates - 1),
                };
              }),
            };
          }),
          lastSavedAt: nowIso(),
        }));
      },

      importCollection: (backup) => {
        set({
          teams: normalizeTeams(backup.teams),
          lastSavedAt: nowIso(),
        });
      },

      resetCollection: () => {
        set({
          teams: cloneInitialTeams(),
          lastSavedAt: nowIso(),
        });
      },
    }),
    {
      name: "albumfind-world-cup-2026",
      skipHydration: true,
      partialize: (state) => ({
        teams: state.teams,
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
