"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import {
  newPostSchema,
  type PostTarget,
  type PostType,
} from "@/components/new-post-schema";
import { UI_TO_ENUM, resolveStaffRoom } from "@/utils/feed";
import { kids } from "@/app/staff/kids/data";

export interface PublishPostResult {
  error?: string;
}

const MAX_PHOTOS = 4;

const publishPostSchema = newPostSchema
  .extend({
    photoPaths: z.array(z.string().min(1)).default([]),
  })
  .refine(
    (data) => data.type !== "Foto" || data.photoPaths.length >= 1,
    { message: "El tipo Foto requiere al menos una imagen", path: ["photoPaths"] }
  );

export async function publishPost(input: {
  targets: PostTarget[];
  type: PostType;
  description: string;
  photoPaths: string[];
}): Promise<PublishPostResult> {
  const parsed = publishPostSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Completá todos los campos correctamente." };
  }

  if (parsed.data.photoPaths.length > MAX_PHOTOS) {
    return { error: "Máximo 4 fotos por publicación." };
  }

  const supabase = createClient(await cookies());

  const claims = await supabase.auth.getClaims();
  const userId = claims.data?.claims?.sub;
  if (!userId) {
    return { error: "Debés iniciar sesión para publicar." };
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, daycare_id, role")
    .eq("id", userId)
    .single();
  if (!user) {
    return { error: "No se pudo verificar tu usuario." };
  }
  if (user.role !== "staff") {
    return { error: "Solo el staff del daycare puede publicar." };
  }

  const { targets, type, description, photoPaths } = parsed.data;
  const typeEnum = UI_TO_ENUM[type];

  const room = await resolveStaffRoom(supabase, user.daycare_id);
  if (!room) {
    return { error: "No se pudo resolver la sala del staff." };
  }
  const roomId = room.id;

  let childIds: string[] = [];
  if (targets[0] !== "toda-la-sala") {
    const names = targets.map(
      (slug) => kids.find((kid) => kid.slug === slug)?.name
    );
    if (names.some((name) => name === undefined)) {
      return { error: "No se encontraron algunos niños seleccionados." };
    }
    const resolvedNames = names as string[];

    const { data: children } = await supabase
      .from("children")
      .select("id, full_name, photo_consent")
      .eq("room_id", roomId)
      .in("full_name", resolvedNames);

    if (!children) {
      return { error: "No se pudieron cargar los niños seleccionados." };
    }

    const byName = new Map(children.map((child) => [child.full_name, child]));
    const missing = resolvedNames.filter((name) => !byName.has(name));
    if (missing.length > 0) {
      return {
        error: `No se encontraron niños en la sala para: ${missing.join(", ")}.`,
      };
    }

    childIds = resolvedNames.map((name) => byName.get(name)!.id);

    if (photoPaths.length > 0) {
      const noConsent = children.filter((child) => !child.photo_consent);
      if (noConsent.length > 0) {
        return {
          error: `Hay niños sin consentimiento para fotos: ${noConsent
            .map((child) => child.full_name.split(" ")[0])
            .join(", ")}.`,
        };
      }
    }
  } else if (photoPaths.length > 0) {
    const { data: noConsent } = await supabase
      .from("children")
      .select("full_name")
      .eq("room_id", roomId)
      .eq("status", "active")
      .eq("photo_consent", false);

    if (noConsent && noConsent.length > 0) {
      return {
        error: `Hay niños sin consentimiento para fotos: ${noConsent
          .map((child) => child.full_name.split(" ")[0])
          .join(", ")}.`,
      };
    }
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      room_id: roomId,
      type: typeEnum,
      body: description,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (postError || !post) {
    return { error: "No se pudo publicar la publicación." };
  }

  if (childIds.length > 0) {
    const { error: pcError } = await supabase.from("post_children").insert(
      childIds.map((childId) => ({ post_id: post.id, child_id: childId }))
    );
    if (pcError) {
      return { error: "No se pudieron guardar los destinatarios." };
    }
  }

  if (photoPaths.length > 0) {
    const { error: ppError } = await supabase.from("post_photos").insert(
      photoPaths.map((url, index) => ({
        post_id: post.id,
        url,
        position: index,
      }))
    );
    if (ppError) {
      return { error: "No se pudieron guardar las fotos." };
    }
  }

  return {};
}