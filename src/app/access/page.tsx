"use client";

import { LockKeyhole } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import styles from "./access.module.css";

export default function AccessPage() {
  const searchParams = useSearchParams();
  const destination = useMemo(() => {
    const value = searchParams.get("next");
    return value && value.startsWith("/") ? value : "/";
  }, [searchParams]);

  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!/^\d{4}$/.test(pin)) {
      setMessage("Ingresa un PIN de cuatro números.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "No fue posible validar el PIN.");
        return;
      }

      window.location.assign(destination);
    } catch {
      setMessage("No fue posible conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <LockKeyhole size={28} />
        </div>

        <p className={styles.eyebrow}>Acceso privado</p>
        <h1>ALBUMFIND</h1>
        <p className={styles.copy}>
          Ingresa el PIN de cuatro números para abrir tu colección.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="pin">PIN de acceso</label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            pattern="[0-9]{4}"
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="••••"
            autoFocus
          />

          {message && (
            <p className={styles.error} role="alert">
              {message}
            </p>
          )}

          <button type="submit" disabled={submitting || pin.length !== 4}>
            {submitting ? "Verificando…" : "Entrar"}
          </button>
        </form>

        <p className={styles.note}>
          El acceso quedará autorizado en este navegador durante 30 días.
        </p>
      </section>
    </main>
  );
}
