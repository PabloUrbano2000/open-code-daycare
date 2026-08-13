"use server";

import { redirect } from "next/navigation";

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/activate-account`;

export interface ActivateResult {
  error?: string;
}

export async function activate(input: {
  code: string;
  email: string;
  password: string;
}): Promise<ActivateResult> {
  const { code, email, password } = input;

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, email, password }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    ok?: boolean;
  };

  if (!response.ok || !data.ok) {
    return { error: mapError(data.error) };
  }

  redirect("/login?activated=1");
}

function mapError(code?: string): string {
  switch (code) {
    case "invalid":
      return "Código inválido";
    case "expired":
      return "El código expiró";
    case "used":
      return "La invitación ya fue utilizada";
    case "password":
      return "La contraseña debe tener al menos 6 caracteres";
    case "email_mismatch":
      return "El email no coincide con la invitación";
    default:
      return "No se pudo activar la cuenta. Revisá los datos e intentá de nuevo.";
  }
}
