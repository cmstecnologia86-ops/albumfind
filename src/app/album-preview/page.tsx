import Link from "next/link";

import AlbumPreviewClient from "@/components/album/AlbumPreviewClient";

export default function AlbumPreviewPage() {
  return (
    <main className="album-preview-page">
      <div className="album-preview-toolbar">
        <div>
          <span>Laboratorio visual</span>
          <h1>Vista nacional del álbum</h1>
          <p>
            Plantilla editorial conectada al inventario persistente real.
          </p>
        </div>

        <Link href="/album">
          Volver al álbum actual
        </Link>
      </div>

      <AlbumPreviewClient />

      <div className="album-preview-note">
        <strong>Vista dinámica</strong>
        <p>
          Los estados obtenida y faltante provienen de la colección
          almacenada en el navegador.
        </p>
      </div>
    </main>
  );
}
