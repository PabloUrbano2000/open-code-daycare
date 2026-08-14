"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, TriangleAlert, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, get } from "react-hook-form";
import { kids } from "@/app/staff/kids/data";
import {
  fieldClass,
  FieldLabel,
  FieldError,
  fieldErrorId,
} from "@/components/form-controls";
import { createClient } from "@/utils/supabase/client";
import { publishPost } from "@/app/posts/actions";
import {
  NEW_POST_TARGETS,
  POST_TYPES,
  POST_TYPE_STYLES,
  newPostSchema,
  type NewPostValues,
  type PostTarget,
  type PostType,
} from "@/components/new-post-schema";

export {
  NEW_POST_TARGETS,
  POST_TYPES,
  POST_TYPE_STYLES,
  newPostSchema,
};
export type { NewPostValues, PostTarget, PostType };

const MAX_PHOTOS = 4;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface PhotoDraft {
  id: string;
  file: File;
  preview: string;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const pillBase =
  "rounded-full text-[14px] font-bold transition border-[1.5px]";

function targetPillClass(active: boolean) {
  return `${pillBase} ${
    active
      ? "border-ink bg-ink text-white"
      : "border-line bg-surface text-ink-soft"
  }`;
}

function toggleTarget(
  current: readonly PostTarget[],
  option: PostTarget
): PostTarget[] {
  if (option === "toda-la-sala") {
    return ["toda-la-sala"];
  }
  if (current.includes("toda-la-sala")) {
    return [option];
  }
  return current.includes(option)
    ? current.filter((t) => t !== option)
    : [...current, option];
}

export function NewPostDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const descriptionId = useId();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewPostValues>({
    resolver: zodResolver(newPostSchema),
    defaultValues: {
      targets: ["mateo-fernandez"],
      type: "Comida",
      description: "",
    },
  });

  function clearPhotos() {
    setPhotos((prev) => {
      prev.forEach((photo) => URL.revokeObjectURL(photo.preview));
      return [];
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      clearPhotos();
      setError(null);
    }
  }

  function closeAndReset() {
    reset();
    clearPhotos();
    setError(null);
    setOpen(false);
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || isPublishing) return;
    const incoming = Array.from(fileList);
    setError(null);

    const rejected = incoming.find(
      (file) =>
        !PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_SIZE
    );
    if (rejected) {
      setError("Solo fotos JPG, PNG o WEBP de hasta 5 MB.");
      return;
    }

    if (photos.length + incoming.length > MAX_PHOTOS) {
      setError("Máximo 4 fotos por publicación.");
      return;
    }

    setPhotos((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        id: randomId(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((photo) => photo.id !== id);
    });
  }

  async function uploadPhotos(files: File[]): Promise<string[]> {
    const supabase = createClient();

    const { data: user } = await supabase
      .from("users")
      .select("daycare_id")
      .single();
    const daycareId = user?.daycare_id;
    if (!daycareId) {
      throw new Error("No se pudo identificar tu daycare.");
    }

    const paths: string[] = [];
    for (const file of files) {
      const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${daycareId}/${randomId()}.${extension}`;
      const { error } = await supabase.storage
        .from("post-photos")
        .upload(path, file);
      if (error) {
        throw new Error("No se pudo subir una de las fotos.");
      }
      paths.push(path);
    }
    return paths;
  }

  async function onSubmit(values: NewPostValues) {
    if (values.type === "Foto" && photos.length === 0) {
      setError("El tipo Foto requiere al menos una imagen.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const photoPaths =
        photos.length > 0
          ? await uploadPhotos(photos.map((photo) => photo.file))
          : [];

      const result = await publishPost({
        targets: values.targets,
        type: values.type,
        description: values.description,
        photoPaths,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      closeAndReset();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo publicar la publicación."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#3F362E]/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[580px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
          <Dialog.Description className="sr-only">
            Formulario para crear una publicación con destinatarios, tipo,
            descripción y fotos.
          </Dialog.Description>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isPublishing}
                  className="text-[15px] font-bold text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <Dialog.Title className="m-0 font-display text-[18px] font-semibold text-ink">
                Nueva publicación
              </Dialog.Title>
              <button
                type="submit"
                disabled={isPublishing}
                className="text-[15px] font-extrabold text-coral-brand transition hover:text-coral-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPublishing ? "Publicando…" : "Publicar"}
              </button>
            </div>

            <div className="px-[26px] py-6">
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-[12px] bg-[#FBDAD6] px-4 py-3">
                  <TriangleAlert
                    size={18}
                    strokeWidth={2}
                    className="mt-0.5 flex-none text-[#C5413A]"
                  />
                  <span className="text-[13px] font-bold text-[#C5413A]">
                    {error}
                  </span>
                </div>
              )}

              <div className="mb-[22px]">
                <FieldLabel>PARA</FieldLabel>
                <Controller
                  name="targets"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-[9px]">
                      {NEW_POST_TARGETS.map((option) => {
                        const kid = kids.find((k) => k.slug === option);
                        const active = field.value.includes(option);
                        if (!kid) {
                          return (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={active}
                              disabled={isPublishing}
                              onClick={() =>
                                field.onChange(
                                  toggleTarget(field.value, "toda-la-sala")
                                )
                              }
                              className={`${targetPillClass(active)} px-4 py-[6px] disabled:opacity-60`}
                            >
                              Toda la sala
                            </button>
                          );
                        }
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={active}
                            disabled={isPublishing}
                            onClick={() =>
                              field.onChange(
                                toggleTarget(field.value, option)
                              )
                            }
                            className={`${targetPillClass(active)} flex items-center gap-2 py-[6px] pl-[6px] pr-[14px] disabled:opacity-60`}
                          >
                            <span
                              className="flex size-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                              style={{
                                background: kid.avatarBg,
                                color: kid.avatarColor,
                              }}
                            >
                              {kid.initials}
                            </span>
                            {kid.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                <FieldError
                  id={fieldErrorId("targets")}
                  message={get(errors, "targets.message") as string | undefined}
                />
              </div>

              <div className="mb-[22px]">
                <FieldLabel>TIPO</FieldLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-[9px]">
                      {POST_TYPES.map((type) => {
                        const styles = POST_TYPE_STYLES[type];
                        const active = field.value === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={active}
                            disabled={isPublishing}
                            onClick={() => field.onChange(type)}
                            className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold transition disabled:opacity-60 ${
                              active ? "ring-2 ring-ink/40" : ""
                            }`}
                            style={{ background: styles.bg, color: styles.text }}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              <div className="mb-[22px]">
                <FieldLabel htmlFor={descriptionId}>DESCRIPCIÓN</FieldLabel>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id={descriptionId}
                      placeholder="Contá cómo le fue hoy…"
                      disabled={isPublishing}
                      aria-invalid={errors.description ? true : undefined}
                      aria-describedby={
                        errors.description
                          ? fieldErrorId("description")
                          : undefined
                      }
                      className={`${fieldClass} min-h-[120px] resize-y py-[14px] leading-[1.5] disabled:opacity-60 ${
                        errors.description ? "border-danger" : ""
                      }`}
                    />
                  )}
                />
                <FieldError
                  id={fieldErrorId("description")}
                  message={errors.description?.message}
                />
              </div>

              <div>
                <FieldLabel>FOTOS</FieldLabel>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative size-24 flex-none overflow-hidden rounded-[14px] border border-line"
                    >
                      <img
                        src={photo.preview}
                        alt="Vista previa de la foto"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Quitar foto"
                        disabled={isPublishing}
                        onClick={() => removePhoto(photo.id)}
                        className="absolute right-1 top-1 flex size-[22px] items-center justify-center rounded-full bg-ink/70 text-white transition hover:bg-ink disabled:opacity-50"
                      >
                        <X size={13} strokeWidth={2.6} />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      disabled={isPublishing}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex size-24 flex-none flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-field-border bg-field text-field-ink transition hover:border-coral-dark disabled:opacity-60"
                    >
                      <Plus size={22} strokeWidth={2} className="text-coral-dark" />
                      <span className="text-[12px]">Agregar</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    handleFilesSelected(event.target.files);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}