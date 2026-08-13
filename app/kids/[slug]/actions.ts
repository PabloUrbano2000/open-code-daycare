"use server";

import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import {
  linkParentSchema,
  type Relation,
} from "@/components/link-parent-schema";
import { InvitationEmail } from "@/emails/invitation";

const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

const relationToEnum: Record<Relation, "mother" | "father" | "guardian"> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[randomInt(CODE_CHARSET.length)];
  }
  return code;
}

type SendEmailResult =
  | { ok: true }
  | { ok: false; kind: "config" | "transient" };

function isConfigError(error: { name?: string; statusCode?: number | null }): boolean {
  if (error.name === "validation_error") {
    return true;
  }
  return error.statusCode === 401 || error.statusCode === 403;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendInvitationEmail(input: {
  to: string;
  kidName: string;
  code: string;
  activationUrl: string;
  invitationId: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, kind: "config" };
  }

  const resend = new Resend(apiKey);
  const payload = {
    from: process.env.EMAIL_FROM ?? "OpenDayCare <onboarding@resend.dev>",
    to: input.to,
    subject: `Te invitaron a seguir a ${input.kidName}`,
    react: InvitationEmail({
      kidName: input.kidName,
      code: input.code,
      expiresLabel: "Vence en 7 días",
      activationUrl: input.activationUrl,
    }),
  };

  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { error } = await resend.emails.send(payload, {
      idempotencyKey: `invite-${input.invitationId}`,
    });

    if (!error) {
      return { ok: true };
    }

    if (isConfigError(error)) {
      return { ok: false, kind: "config" };
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(800 * (attempt + 1));
    }
  }

  return { ok: false, kind: "transient" };
}

export interface InviteParentResult {
  code?: string;
  expiresAt?: string;
  error?: string;
}

export async function inviteParent(input: {
  name: string;
  email: string;
  relation: Relation;
  childId: string;
  kidName: string;
}): Promise<InviteParentResult> {
  const parsed = linkParentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Completá todos los campos correctamente." };
  }

  const supabase = createClient(await cookies());

  const claims = await supabase.auth.getClaims();
  const invitedById = claims.data?.claims?.sub;
  if (!invitedById) {
    return { error: "Debés iniciar sesión para invitar a un padre." };
  }

  const email = parsed.data.email.trim();
  const relationship = relationToEnum[parsed.data.relation];

  await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("child_id", input.childId)
    .ilike("email", email)
    .eq("status", "pending");

  let code = generateCode();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: inserted, error: insertError } = await supabase
      .from("invitations")
      .insert({
        child_id: input.childId,
        invited_by: invitedById,
        full_name: parsed.data.name.trim(),
        email,
        relationship,
        code,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id, code, expires_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505" && attempt < 2) {
        code = generateCode();
        continue;
      }
      return { error: "No se pudo crear la invitación." };
    }

    const sendResult = await sendInvitationEmail({
      to: email,
      kidName: input.kidName,
      code,
      activationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/activate?email=${encodeURIComponent(email)}`,
      invitationId: inserted.id,
    });

    if (!sendResult.ok) {
      await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", inserted.id);
      return {
        error:
          sendResult.kind === "config"
            ? "No se pudo enviar el correo. Revisá la configuración de email."
            : "No se pudo enviar el correo. Intentá de nuevo en un momento.",
      };
    }

    return { code, expiresAt: inserted.expires_at };
  }

  return { error: "No se pudo crear la invitación." };
}
