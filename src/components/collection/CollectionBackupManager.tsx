"use client";

import { Download, Save, Upload, X } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";

import {
  CollectionBackup,
  Team,
  useAlbumStore,
} from "@/store/useAlbumStore";

function formatSavedAt(value: string | null) {
  if (!value) {
    return "Colección inicial cargada";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isValidBackup(value: unknown, currentTeams: Team[]): value is CollectionBackup {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CollectionBackup>;

  if (
    candidate.format !== "albumfind-backup" ||
    candidate.version !== 1 ||
    !Array.isArray(candidate.teams) ||
    candidate.teams.length !== currentTeams.length
  ) {
    return false;
  }

  const currentByCode = new Map(currentTeams.map((team) => [team.code, team]));

  return candidate.teams.every((team) => {
    if (!team || typeof team !== "object") {
      return false;
    }

    const currentTeam = currentByCode.get(team.code);

    if (!currentTeam || !Array.isArray(team.stickers)) {
      return false;
    }

    const currentStickerCodes = new Set(
      currentTeam.stickers.map((sticker) => sticker.code),
    );

    return (
      team.stickers.length === currentTeam.stickers.length &&
      team.stickers.every(
        (sticker) =>
          sticker &&
          typeof sticker.code === "string" &&
          currentStickerCodes.has(sticker.code) &&
          (sticker.status === "owned" || sticker.status === "missing") &&
          Number.isFinite(sticker.duplicates) &&
          sticker.duplicates >= 0,
      )
    );
  });
}

export default function CollectionBackupManager() {
  const teams = useAlbumStore((state) => state.teams);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);
  const lastSavedAt = useAlbumStore((state) => state.lastSavedAt);
  const importCollection = useAlbumStore((state) => state.importCollection);
  const resetCollection = useAlbumStore((state) => state.resetCollection);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const savedLabel = useMemo(
    () => formatSavedAt(lastSavedAt),
    [lastSavedAt],
  );

  if (!hasHydrated) {
    return null;
  }

  const exportBackup = () => {
    const backup: CollectionBackup = {
      format: "albumfind-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      teams,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `albumfind-respaldo-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setIsError(false);
    setMessage("Respaldo descargado correctamente.");
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as unknown;

      if (!isValidBackup(parsed, teams)) {
        throw new Error("El archivo no corresponde a esta colección de ALBUMFIND.");
      }

      importCollection(parsed);
      setIsError(false);
      setMessage("Colección restaurada y guardada en este navegador.");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible restaurar el respaldo.",
      );
    }
  };

  const confirmReset = () => {
    const accepted = window.confirm(
      "¿Reiniciar la colección? Se reemplazará el avance guardado en este navegador por el estado inicial.",
    );

    if (!accepted) {
      return;
    }

    resetCollection();
    setIsError(false);
    setMessage("La colección volvió al estado inicial.");
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 100,
        display: "grid",
        justifyItems: "end",
        gap: 10,
      }}
    >
      {isOpen && (
        <section
          aria-label="Guardado y respaldo de colección"
          style={{
            width: "min(390px, calc(100vw - 32px))",
            padding: 18,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20,
            background: "rgba(14,17,32,0.97)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>
                Progreso guardado
              </strong>
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  color: "#a6abc1",
                  fontSize: 12,
                }}
              >
                Guardado automático en este navegador
              </span>
            </div>

            <button
              type="button"
              aria-label="Cerrar panel de guardado"
              onClick={() => setIsOpen(false)}
              style={{
                display: "grid",
                width: 34,
                height: 34,
                placeItems: "center",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                color: "#f7f8ff",
              }}
            >
              <X size={17} />
            </button>
          </div>

          <div
            style={{
              margin: "16px 0",
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(201,255,63,0.08)",
              color: "#dfff8d",
              fontSize: 13,
            }}
          >
            Último cambio: {savedLabel}
          </div>

          <div style={{ display: "grid", gap: 9 }}>
            <button
              type="button"
              onClick={exportBackup}
              style={{
                display: "flex",
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                border: 0,
                borderRadius: 12,
                background: "linear-gradient(135deg, #7657ff, #a454ff)",
                color: "white",
                fontWeight: 800,
              }}
            >
              <Download size={18} />
              Descargar respaldo
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex",
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                color: "#f7f8ff",
                fontWeight: 750,
              }}
            >
              <Upload size={18} />
              Restaurar respaldo
            </button>

            <button
              type="button"
              onClick={confirmReset}
              style={{
                minHeight: 40,
                border: 0,
                background: "transparent",
                color: "#ffae79",
                fontWeight: 700,
              }}
            >
              Reiniciar colección
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={importBackup}
            hidden
          />

          {message && (
            <p
              role={isError ? "alert" : "status"}
              style={{
                margin: "13px 0 0",
                color: isError ? "#ff9d9d" : "#c9ff3f",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        style={{
          display: "flex",
          minHeight: 48,
          alignItems: "center",
          gap: 10,
          padding: "0 17px",
          border: "1px solid rgba(201,255,63,0.26)",
          borderRadius: 999,
          background: "rgba(14,17,32,0.94)",
          color: "#f7f8ff",
          boxShadow: "0 16px 44px rgba(0,0,0,0.38)",
          backdropFilter: "blur(16px)",
          fontWeight: 800,
        }}
      >
        <Save size={18} color="#c9ff3f" />
        Guardado automático
      </button>
    </div>
  );
}
