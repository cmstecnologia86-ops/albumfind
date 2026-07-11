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
  KOR: {
    colors: {
      primary: "#c60c30",
      secondary: "#003478",
      accent: "#ffffff",
      ink: "#18243a",
      paper: "#f5f3ef",
      muted: "#ddd9d4",
    },
  },
  RSA: {
    colors: {
      primary: "#007749",
      secondary: "#ffb81c",
      accent: "#001489",
      ink: "#173d31",
      paper: "#f3f1e4",
      muted: "#d7dfd2",
    },
  },
  CZE: {
    colors: {
      primary: "#11457e",
      secondary: "#d7141a",
      accent: "#ffffff",
      ink: "#213451",
      paper: "#f3f4f3",
      muted: "#d9dce0",
    },
  },
  CAN: {
    colors: {
      primary: "#d80621",
      secondary: "#ffffff",
      accent: "#73000f",
      ink: "#48191f",
      paper: "#f7f2ee",
      muted: "#e1d8d3",
    },
  },
  BIH: {
    colors: {
      primary: "#002395",
      secondary: "#fecb00",
      accent: "#ffffff",
      ink: "#182c5c",
      paper: "#f3f2e8",
      muted: "#d8d9d3",
    },
  },
  QAT: {
    colors: {
      primary: "#8a1538",
      secondary: "#ffffff",
      accent: "#d5a65c",
      ink: "#4b1f2c",
      paper: "#f4efec",
      muted: "#ddd3d2",
    },
  },
  SUI: {
    colors: {
      primary: "#d52b1e",
      secondary: "#ffffff",
      accent: "#83170f",
      ink: "#421c19",
      paper: "#f6f1ec",
      muted: "#dfd7d1",
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
  MAR: {
    colors: {
      primary: "#c1272d",
      secondary: "#006233",
      accent: "#ffffff",
      ink: "#4c2022",
      paper: "#f5f0e8",
      muted: "#ddd5cb",
    },
  },
  HAI: {
    colors: {
      primary: "#00209f",
      secondary: "#d21034",
      accent: "#ffffff",
      ink: "#1d2d58",
      paper: "#f3f1ed",
      muted: "#d8d7d7",
    },
  },
  SCO: {
    colors: {
      primary: "#005eb8",
      secondary: "#ffffff",
      accent: "#1d2c52",
      ink: "#1d3558",
      paper: "#f3f5f5",
      muted: "#d6dde1",
    },
  },
  USA: {
    colors: {
      primary: "#002868",
      secondary: "#bf0a30",
      accent: "#ffffff",
      ink: "#192b4d",
      paper: "#f4f3ef",
      muted: "#d9d9d8",
    },
  },
  PAR: {
    colors: {
      primary: "#d52b1e",
      secondary: "#0038a8",
      accent: "#ffffff",
      ink: "#3f2430",
      paper: "#f4f2ee",
      muted: "#dbd8d3",
    },
  },
  AUS: {
    colors: {
      primary: "#012169",
      secondary: "#ffcd00",
      accent: "#00843d",
      ink: "#182c50",
      paper: "#f3f2e7",
      muted: "#d8ddd0",
    },
  },
  TUR: {
    colors: {
      primary: "#e30a17",
      secondary: "#ffffff",
      accent: "#8f0610",
      ink: "#491b1e",
      paper: "#f5f0eb",
      muted: "#ddd5cf",
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
  CUW: {
    colors: {
      primary: "#002b7f",
      secondary: "#f9e300",
      accent: "#ffffff",
      ink: "#1a315e",
      paper: "#f3f2e8",
      muted: "#d8d9d2",
    },
  },
  CIV: {
    colors: {
      primary: "#f77f00",
      secondary: "#009e60",
      accent: "#ffffff",
      ink: "#53331d",
      paper: "#f6f1e7",
      muted: "#e1d9cb",
    },
  },
  ECU: {
    colors: {
      primary: "#ffdd00",
      secondary: "#034ea2",
      accent: "#ed1c24",
      ink: "#3f3920",
      paper: "#f5f1df",
      muted: "#e0dac7",
    },
  },
  NED: {
    colors: {
      primary: "#f36c21",
      secondary: "#21468b",
      accent: "#ffffff",
      ink: "#503224",
      paper: "#f6f1e8",
      muted: "#dfd7cc",
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
  SWE: {
    colors: {
      primary: "#006aa7",
      secondary: "#fecc02",
      accent: "#ffffff",
      ink: "#17364c",
      paper: "#f3f2e4",
      muted: "#d8dccd",
    },
  },
  TUN: {
    colors: {
      primary: "#e70013",
      secondary: "#ffffff",
      accent: "#8d000c",
      ink: "#471a1f",
      paper: "#f5f1ec",
      muted: "#ddd6d1",
    },
  },
  BEL: {
    colors: {
      primary: "#1d1d1d",
      secondary: "#ffd90c",
      accent: "#ef3340",
      ink: "#171717",
      paper: "#f4f0e4",
      muted: "#dad4c8",
    },
  },
  EGY: {
    colors: {
      primary: "#ce1126",
      secondary: "#ffffff",
      accent: "#000000",
      ink: "#411d21",
      paper: "#f4f0e9",
      muted: "#dcd5ce",
    },
  },
  IRN: {
    colors: {
      primary: "#239f40",
      secondary: "#da0000",
      accent: "#ffffff",
      ink: "#1d4129",
      paper: "#f2f2e8",
      muted: "#d6ddcf",
    },
  },
  NZL: {
    colors: {
      primary: "#141414",
      secondary: "#00247d",
      accent: "#cc142b",
      ink: "#181818",
      paper: "#f2f1ed",
      muted: "#d6d4cf",
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
  CPV: {
    colors: {
      primary: "#003893",
      secondary: "#cf2027",
      accent: "#f7d116",
      ink: "#1e3159",
      paper: "#f3f2e7",
      muted: "#d8d9d0",
    },
  },
  KSA: {
    colors: {
      primary: "#006c35",
      secondary: "#ffffff",
      accent: "#d4af37",
      ink: "#173b2a",
      paper: "#f1f2e8",
      muted: "#d4ddd0",
    },
  },
  URU: {
    colors: {
      primary: "#5cb8e6",
      secondary: "#ffffff",
      accent: "#f6b40e",
      ink: "#263c59",
      paper: "#f2f5f4",
      muted: "#d8e2e4",
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
  SEN: {
    colors: {
      primary: "#00853f",
      secondary: "#fdef42",
      accent: "#e31b23",
      ink: "#183c28",
      paper: "#f3f1df",
      muted: "#d9dcc9",
    },
  },
  IRO: {
    colors: {
      primary: "#ce1126",
      secondary: "#ffffff",
      accent: "#007a3d",
      ink: "#431c22",
      paper: "#f4f1ea",
      muted: "#ddd7cf",
    },
  },
  NOR: {
    colors: {
      primary: "#ba0c2f",
      secondary: "#00205b",
      accent: "#ffffff",
      ink: "#431f2d",
      paper: "#f4f2ed",
      muted: "#dbd8d4",
    },
  },
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
  ALG: {
    colors: {
      primary: "#006233",
      secondary: "#d21034",
      accent: "#ffffff",
      ink: "#173c29",
      paper: "#f3f1e9",
      muted: "#d7dbd1",
    },
  },
  AUT: {
    colors: {
      primary: "#ed2939",
      secondary: "#ffffff",
      accent: "#8e1722",
      ink: "#461d22",
      paper: "#f5f1ec",
      muted: "#ddd6d1",
    },
  },
  JOR: {
    colors: {
      primary: "#007a3d",
      secondary: "#ce1126",
      accent: "#ffffff",
      ink: "#193c2b",
      paper: "#f3f1e9",
      muted: "#d7dcd2",
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
  COD: {
    colors: {
      primary: "#007fff",
      secondary: "#ce1021",
      accent: "#f7d618",
      ink: "#19365f",
      paper: "#f3f2e5",
      muted: "#d8dacf",
    },
  },
  UZB: {
    colors: {
      primary: "#0099b5",
      secondary: "#1eb53a",
      accent: "#ce1126",
      ink: "#1a3c48",
      paper: "#f2f3ed",
      muted: "#d6ddd7",
    },
  },
  COL: {
    colors: {
      primary: "#fcd116",
      secondary: "#003893",
      accent: "#ce1126",
      ink: "#463c19",
      paper: "#f5f1df",
      muted: "#e0dac7",
    },
  },
  ENG: {
    colors: {
      primary: "#14213d",
      secondary: "#ffffff",
      accent: "#c8102e",
      ink: "#20283a",
      paper: "#f5f3ed",
      muted: "#ddd9d2",
    },
  },
  CRO: {
    colors: {
      primary: "#ff0000",
      secondary: "#171796",
      accent: "#ffffff",
      ink: "#42202c",
      paper: "#f4f2ed",
      muted: "#dbd8d4",
    },
  },
  GHA: {
    colors: {
      primary: "#ce1126",
      secondary: "#fcd116",
      accent: "#006b3f",
      ink: "#431f23",
      paper: "#f4f0df",
      muted: "#ddd7c7",
    },
  },
  PAN: {
    colors: {
      primary: "#005293",
      secondary: "#d21034",
      accent: "#ffffff",
      ink: "#1d3151",
      paper: "#f4f2ee",
      muted: "#dad8d4",
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




