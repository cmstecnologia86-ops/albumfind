import Link from "next/link";

import TeamSpread from "@/components/album/TeamSpread";

const mexicoGroup = [
  {
    code: "MEX",
    name: "México",
  },
  {
    code: "RSA",
    name: "Sudáfrica",
  },
  {
    code: "KOR",
    name: "Corea del Sur",
  },
  {
    code: "CZE",
    name: "Chequia",
  },
];

export default function AlbumPreviewPage() {
  return (
    <main className="album-preview-page">
      <div className="album-preview-toolbar">
        <div>
          <span>Laboratorio visual</span>
          <h1>Vista nacional del álbum</h1>
          <p>
            Primera propuesta de identidad editorial aplicada a México.
          </p>
        </div>

        <Link href="/album">
          Volver al álbum actual
        </Link>
      </div>

      <TeamSpread
        group="A"
        groupTeams={mexicoGroup}
        ownedCount={8}
        teamCode="MEX"
        teamName="México"
        totalCount={20}
      />

      <div className="album-preview-note">
        <strong>Vista de prueba</strong>
        <p>
          Esta página todavía no utiliza las láminas reales. Se emplea
          únicamente para aprobar la estructura, la escala y la identidad
          visual antes de integrarla al álbum interactivo.
        </p>
      </div>
    </main>
  );
}
