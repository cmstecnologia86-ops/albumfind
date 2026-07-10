import { Suspense } from "react";

import AlbumViewer from "@/components/album/AlbumViewer";

export const metadata = {
  title: "Mi álbum · ALBUMFIND",
  description: "Vista interactiva del álbum del Mundial 2026.",
};

function AlbumLoading() {
  return (
    <main className="album-page-shell">
      <div className="album-loading">
        <span>ALBUMFIND</span>
        <strong>Abriendo el álbum…</strong>
      </div>
    </main>
  );
}

export default function AlbumPage() {
  return (
    <Suspense fallback={<AlbumLoading />}>
      <AlbumViewer />
    </Suspense>
  );
}
