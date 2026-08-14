import { z } from "zod";
import { kids } from "@/app/staff/kids/data";

export const POST_TYPES = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
] as const;
export type PostType = (typeof POST_TYPES)[number];

export const NEW_POST_TARGETS = [
  "toda-la-sala",
  ...kids.map((kid) => kid.slug),
] as const;
export type PostTarget = (typeof NEW_POST_TARGETS)[number];

export const POST_TYPE_STYLES: Record<PostType, { bg: string; text: string }> = {
  Comida: { bg: "#9A7B1E", text: "#fff" },
  Siesta: { bg: "#E7DCF6", text: "#7B5FC0" },
  Actividad: { bg: "#2E89A6", text: "#fff" },
  Logro: { bg: "#CFEBD8", text: "#3E9B6C" },
  Ánimo: { bg: "#F9D2DE", text: "#C56486" },
  Foto: { bg: "#FBD8CC", text: "#D9684A" },
  Anuncio: { bg: "#CCD8F4", text: "#4E72C8" },
};

export const newPostSchema = z.object({
  targets: z
    .array(z.enum(NEW_POST_TARGETS))
    .min(1, "Elegí al menos un destinatario"),
  type: z.enum(POST_TYPES),
  description: z.string().min(1, "Escribí una descripción"),
});

export type NewPostValues = z.input<typeof newPostSchema>;
