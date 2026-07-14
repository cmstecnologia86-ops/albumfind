import { NextResponse } from "next/server";

import {
  createPinSessionToken,
  isValidPin,
  PIN_SESSION_COOKIE,
} from "@/lib/pinAuth";

export async function POST(request: Request) {
  let pin = "";

  try {
    const body = (await request.json()) as { pin?: unknown };
    pin = typeof body.pin === "string" ? body.pin.trim() : "";
  } catch {
    return NextResponse.json(
      { ok: false, message: "Solicitud inválida." },
      { status: 400 },
    );
  }

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { ok: false, message: "Ingresa un PIN de cuatro números." },
      { status: 400 },
    );
  }

  if (!process.env.ALBUMFIND_PIN || !process.env.ALBUMFIND_AUTH_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        message: "El acceso privado aún no está configurado en el servidor.",
      },
      { status: 503 },
    );
  }

  if (!(await isValidPin(pin))) {
    return NextResponse.json(
      { ok: false, message: "PIN incorrecto." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: PIN_SESSION_COOKIE,
    value: await createPinSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: PIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
