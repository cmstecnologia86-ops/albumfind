import { Suspense } from "react";
import Link from "next/link";

import AlbumPreviewClient from "@/components/album/AlbumPreviewClient";

function PreviewLoading() {
  return (
    <div className="album-loading">
      <span>ALBUMFIND</span>
      <strong>Preparando la vista editorial…</strong>
    </div>
  );
}

export default function AlbumPreviewPage() {
  return (
    <main className="album-preview-page">
      <div className="album-preview-toolbar">
        <div>
          <span>Laboratorio visual</span>
          <h1>Vista nacional del álbum</h1>
          <p>
            Plantilla editorial dinámica para las 48 selecciones.
          </p>
        </div>

        <Link href="/album">
          Volver al álbum actual
        </Link>
      </div>

      <Suspense fallback={<PreviewLoading />}>
        <AlbumPreviewClient />
      </Suspense>

      <div className="album-preview-note">
        <strong>Vista dinámica</strong>
        <p>
          El país, grupo, progreso y estados de las láminas provienen
          del inventario persistente real.
        </p>
      </div>
    </main>
  );
}
