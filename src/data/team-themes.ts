import type { CSSProperties } from "react";
export type TeamThemeArtwork = {
  pattern: string;
  symbol: string;
  atmosphere: string;
};

export type TeamThemeIdentity = {
  eyebrow: string;
  headline: string;
  slogan: string;
  association: string;
};

export type TeamThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  paper: string;
  muted: string;
};

export type TeamTheme = {
  code: string;
  name: string;
  flag: string;
  colors: TeamThemeColors;
  identity: TeamThemeIdentity;
  artwork: TeamThemeArtwork;
};

const defaultTheme: TeamTheme = {
  code: "DEFAULT",
  name: "Selección",
  flag: "",
  colors: {
    primary: "#216f68",
    secondary: "#75d7c7",
    accent: "#f2f5ee",
    ink: "#102c2a",
    paper: "#f4f1e8",
    muted: "#d8ddd4",
  },
  identity: {
    eyebrow: "Mundial 2026",
    headline: "PASIÓN",
    slogan: "Orgullo de una nación",
    association: "Selección nacional de fútbol",
  },
  artwork: {
    pattern: "geometric",
    symbol: "football",
    atmosphere: "stadium",
  },
};

const teamThemes: Record<string, TeamTheme> = {
  MEX: {
    code: "MEX",
    name: "México",
    flag: "/flags/MEX.png",
    colors: {
      primary: "#006847",
      secondary: "#ce1126",
      accent: "#ffffff",
      ink: "#063c31",
      paper: "#f4f0e6",
      muted: "#d9ded4",
    },
    identity: {
      eyebrow: "We are",
      headline: "VAMOS MÉXICO",
      slogan: "Pasión que nos une",
      association:
        "Federación Mexicana de Fútbol Asociación",
    },
    artwork: {
      pattern: "mexican-geometric",
      symbol: "eagle",
      atmosphere: "supporters",
    },
  },
};

const automaticPalettes: Record<
  string,
  Pick<TeamTheme, "colors">
> = {
  ARG: {
    colors: {
      primary: "#75aadb",
      secondary: "#ffffff",
      accent: "#f6b40e",
      ink: "#24345a",
      paper: "#f3f6f6",
      muted: "#d7e4eb",
    },
  },
  BRA: {
    colors: {
      primary: "#009c3b",
      secondary: "#ffdf00",
      accent: "#002776",
      ink: "#123827",
      paper: "#f4f4df",
      muted: "#dde5c5",
    },
  },
  JPN: {
    colors: {
      primary: "#bc002d",
      secondary: "#ffffff",
      accent: "#1d1d1d",
      ink: "#3a1922",
      paper: "#f6f3ef",
      muted: "#ded9d5",
    },
  },
  FRA: {
    colors: {
      primary: "#0055a4",
      secondary: "#ef4135",
      accent: "#ffffff",
      ink: "#10284a",
      paper: "#f2f4f7",
      muted: "#d9dfe8",
    },
  },
  ESP: {
    colors: {
      primary: "#aa151b",
      secondary: "#f1bf00",
      accent: "#ffffff",
      ink: "#4a1719",
      paper: "#f7f0df",
      muted: "#e2d7c0",
    },
  },
  GER: {
    colors: {
      primary: "#1d1d1d",
      secondary: "#dd0000",
      accent: "#ffce00",
      ink: "#171717",
      paper: "#f3f0e7",
      muted: "#d8d4c8",
    },
  },
  ENG: {
    colors: {
      primary: "#ffffff",
      secondary: "#c8102e",
      accent: "#14213d",
      ink: "#20283a",
      paper: "#f5f3ed",
      muted: "#ddd9d2",
    },
  },
  POR: {
    colors: {
      primary: "#046a38",
      secondary: "#da291c",
      accent: "#ffcd00",
      ink: "#163d2d",
      paper: "#f4eee4",
      muted: "#ddd7ca",
    },
  },
};

export function getTeamTheme(
  teamCode: string,
  teamName?: string,
): TeamTheme {
  const premiumTheme = teamThemes[teamCode];

  if (premiumTheme) {
    return premiumTheme;
  }

  const automaticPalette =
    automaticPalettes[teamCode]?.colors ?? defaultTheme.colors;

  return {
    ...defaultTheme,
    code: teamCode,
    name: teamName ?? defaultTheme.name,
    flag: `/flags/${teamCode}.png`,
    colors: automaticPalette,
    identity: {
      ...defaultTheme.identity,
      headline: `VAMOS ${teamName?.toUpperCase() ?? teamCode}`,
      association: `Selección nacional de ${teamName ?? teamCode}`,
    },
  };
}

export function getTeamThemeCssVariables(
  theme: TeamTheme,
): CSSProperties {
  return {
    "--team-primary": theme.colors.primary,
    "--team-secondary": theme.colors.secondary,
    "--team-accent": theme.colors.accent,
    "--team-ink": theme.colors.ink,
    "--team-paper": theme.colors.paper,
    "--team-muted": theme.colors.muted,
  } as CSSProperties;
}

