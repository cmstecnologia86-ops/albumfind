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

type CollectionSource = {
  teams: Team[];
};

type AlbumStore = {
  teams: Team[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  toggleSticker: (teamCode: string, stickerCode: string) => void;
  incrementDuplicate: (teamCode: string, stickerCode: string) => void;
  decrementDuplicate: (teamCode: string, stickerCode: string) => void;
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

export const useAlbumStore = create<AlbumStore>()(
  persist(
    (set) => ({
      teams: cloneInitialTeams(),
      hasHydrated: false,

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
        }));
      },

      resetCollection: () => {
        set({
          teams: cloneInitialTeams(),
        });
      },
    }),
    {
      name: "albumfind-world-cup-2026",
      skipHydration: true,
      partialize: (state) => ({
        teams: state.teams,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

