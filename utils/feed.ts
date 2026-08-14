import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { kids, type Kid } from "@/app/staff/kids/data";
import { createClient } from "@/utils/supabase/server";

export const POST_TYPE_UI_LABELS = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
] as const;

export type FeedPostType = (typeof POST_TYPE_UI_LABELS)[number];

export const UI_TO_ENUM: Record<FeedPostType, string> = {
  Comida: "meal",
  Siesta: "nap",
  Actividad: "activity",
  Logro: "achievement",
  Ánimo: "mood",
  Foto: "photo",
  Anuncio: "announcement",
};

export const ENUM_TO_UI: Record<string, FeedPostType> = Object.fromEntries(
  Object.entries(UI_TO_ENUM).map(([label, value]) => [value, label])
) as Record<string, FeedPostType>;

export interface FeedAuthor {
  id: string;
  fullName: string;
}

export interface FeedRecipient {
  id: string;
  fullName: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
}

export interface FeedPhoto {
  id: string;
  url: string;
  position: number;
}

export interface FeedPost {
  id: string;
  type: FeedPostType;
  title: string | null;
  body: string;
  publishedAt: string;
  timeLabel: string;
  roomId: string | null;
  author: FeedAuthor;
  recipients: FeedRecipient[];
  para: string;
  photos: FeedPhoto[];
}

export interface FeedContext {
  userFullName: string;
  userInitials: string;
  greeting: string;
  roomName: string;
  activeKidsCount: number;
  currentDateLabel: string;
}

export interface FeedData {
  context: FeedContext;
  posts: FeedPost[];
}

export interface PostBadge {
  label: string;
  bg: string;
  dot: string;
  text: string;
}

const BADGE_STYLES: Record<FeedPostType, Omit<PostBadge, "label">> = {
  Comida: { bg: "#F7E7A6", dot: "#9A7B1E", text: "#9A7B1E" },
  Siesta: { bg: "#E7DCF6", dot: "#7B5FC0", text: "#7B5FC0" },
  Actividad: { bg: "#C7E7F1", dot: "#2E89A6", text: "#2E89A6" },
  Logro: { bg: "#CFEBD8", dot: "#3E9B6C", text: "#3E9B6C" },
  Ánimo: { bg: "#F9D2DE", dot: "#C56486", text: "#C56486" },
  Foto: { bg: "#FBD8CC", dot: "#D9684A", text: "#D9684A" },
  Anuncio: { bg: "#CCD8F4", dot: "#4E72C8", text: "#4E72C8" },
};

export function badgeForType(type: FeedPostType): PostBadge {
  return { label: type.toUpperCase(), ...BADGE_STYLES[type] };
}

export function kidByFullName(fullName: string): Kid | undefined {
  return kids.find((kid) => kid.name === fullName);
}

export function paraText(
  recipients: Pick<FeedRecipient, "fullName">[]
): string {
  if (recipients.length === 0) return "Para: toda la sala";
  const names = recipients.map((r) => r.fullName.split(" ")[0]).join(", ");
  return `Para: familia de ${names}`;
}

export async function resolveStaffRoom(
  supabase: SupabaseClient,
  daycareId: string
): Promise<{ id: string; name: string } | null> {
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("daycare_id", daycareId)
    .order("created_at", { ascending: true });

  if (!rooms || rooms.length === 0) return null;
  return rooms.find((room) => room.name === "Soles") ?? rooms[0];
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatCurrentDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(
    ".",
    ""
  );
  return `${weekday} ${day} ${month}`;
}

function initialsFromName(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("/") || /^https?:\/\//.test(url);
}

export async function getFeed(): Promise<FeedData | null> {
  const supabase = createClient(await cookies());

  const claims = await supabase.auth.getClaims();
  const userId = claims.data?.claims?.sub;
  if (!userId) return null;

  const { data: user } = await supabase
    .from("users")
    .select("id, daycare_id, full_name")
    .eq("id", userId)
    .single();
  if (!user) return null;

  const room = await resolveStaffRoom(supabase, user.daycare_id);
  const roomName = room?.name ?? "Sala";

  const { count } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room?.id ?? "")
    .eq("status", "active");

  const { data: posts } = await supabase
    .from("posts")
    .select("id, author_id, type, title, body, published_at, room_id")
    .order("published_at", { ascending: false });
  if (!posts) return null;

  const postIds = posts.map((post) => post.id);
  const authorIds = [...new Set(posts.map((post) => post.author_id))];

  const [{ data: postChildren }, { data: postPhotos }, { data: authors }] =
    await Promise.all([
      supabase
        .from("post_children")
        .select("post_id, child_id")
        .in("post_id", postIds),
      supabase
        .from("post_photos")
        .select("id, post_id, url, position")
        .in("post_id", postIds),
      supabase.from("users").select("id, full_name").in("id", authorIds),
    ]);

  const childIds = [
    ...new Set((postChildren ?? []).map((row) => row.child_id)),
  ];
  const { data: children } =
    childIds.length > 0
      ? await supabase
          .from("children")
          .select("id, full_name")
          .in("id", childIds)
      : { data: [] };

  const bucketPaths = (postPhotos ?? [])
    .map((photo) => photo.url)
    .filter((url) => !isAbsoluteUrl(url));
  const { data: signed } =
    bucketPaths.length > 0
      ? await supabase.storage
          .from("post-photos")
          .createSignedUrls(bucketPaths, 3600)
      : { data: [] };

  const signedByPath = new Map(
    (signed ?? []).map((entry) => [entry.path, entry.signedUrl])
  );
  const childrenById = new Map((children ?? []).map((c) => [c.id, c]));
  const authorsById = new Map((authors ?? []).map((u) => [u.id, u.full_name]));

  const feedPosts: FeedPost[] = (posts ?? []).map((post) => {
    const recipients: FeedRecipient[] = (postChildren ?? [])
      .filter((row) => row.post_id === post.id)
      .map((row) => childrenById.get(row.child_id))
      .filter((child): child is { id: string; full_name: string } =>
        Boolean(child)
      )
      .map((child) => {
        const kid = kidByFullName(child.full_name);
        return {
          id: child.id,
          fullName: child.full_name,
          initials: kid?.initials ?? initialsFromName(child.full_name),
          avatarBg: kid?.avatarBg ?? "#F4ECE1",
          avatarColor: kid?.avatarColor ?? "#A89A8B",
        };
      });

    const photos: FeedPhoto[] = (postPhotos ?? [])
      .filter((photo) => photo.post_id === post.id)
      .sort((a, b) => a.position - b.position)
      .map((photo) => ({
        id: photo.id,
        position: photo.position,
        url: isAbsoluteUrl(photo.url)
          ? photo.url
          : signedByPath.get(photo.url) ?? photo.url,
      }));

    return {
      id: post.id,
      type: ENUM_TO_UI[post.type] ?? "Anuncio",
      title: post.title,
      body: post.body,
      publishedAt: post.published_at,
      timeLabel: formatTime(post.published_at),
      roomId: post.room_id,
      author: {
        id: post.author_id,
        fullName: authorsById.get(post.author_id) ?? "Staff",
      },
      recipients,
      para: paraText(recipients),
      photos,
    };
  });

  const firstName = user.full_name.split(" ")[0];

  return {
    context: {
      userFullName: user.full_name,
      userInitials: initialsFromName(user.full_name),
      greeting: `Buenas, ${firstName}`,
      roomName,
      activeKidsCount: count ?? 0,
      currentDateLabel: formatCurrentDate(),
    },
    posts: feedPosts,
  };
}