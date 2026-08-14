import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  ENUM_TO_UI,
  badgeForType,
  formatCurrentDate,
  formatTime,
  kidByFullName,
  paraText,
  type FeedPhoto,
  type PostBadge,
} from "@/utils/feed";

export interface FamilyChild {
  id: string;
  fullName: string;
  firstName: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
}

export interface FamilyPost {
  id: string;
  type: string;
  title: string | null;
  body: string;
  timeLabel: string;
  roomName: string | null;
  author: string;
  para: string;
  recipientIds: string[];
  child: FamilyChild | null;
  photos: FeedPhoto[];
  badge: PostBadge;
}

export interface FamilyFeedContext {
  userFullName: string;
  greeting: string;
  roomName: string;
  currentDateLabel: string;
}

export interface FamilyFeedData {
  context: FamilyFeedContext;
  children: FamilyChild[];
  posts: FamilyPost[];
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

export async function getFamilyFeed(): Promise<FamilyFeedData | null> {
  const supabase = createClient(await cookies());

  const claims = await supabase.auth.getClaims();
  const userId = claims.data?.claims?.sub;
  if (!userId) return null;

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("id", userId)
    .single();
  if (!user) return null;

  const { data: links } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", userId);
  const linkedChildIds = (links ?? []).map((link) => link.child_id);

  const children: FamilyChild[] = [];
  let roomName = "Sala";

  if (linkedChildIds.length > 0) {
    const { data: childRows } = await supabase
      .from("children")
      .select("id, full_name, room_id")
      .in("id", linkedChildIds);

    const roomIds = [
      ...new Set((childRows ?? []).map((child) => child.room_id).filter(Boolean)),
    ];
    const { data: roomRows } =
      roomIds.length > 0
        ? await supabase.from("rooms").select("id, name").in("id", roomIds)
        : { data: [] };
    roomName = roomRows?.[0]?.name ?? "Sala";

    for (const child of childRows ?? []) {
      const kid = kidByFullName(child.full_name);
      children.push({
        id: child.id,
        fullName: child.full_name,
        firstName: child.full_name.split(" ")[0],
        initials: kid?.initials ?? initialsFromName(child.full_name),
        avatarBg: kid?.avatarBg ?? "#F4ECE1",
        avatarColor: kid?.avatarColor ?? "#A89A8B",
      });
    }
  }

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

  const childrenById = new Map(children.map((child) => [child.id, child]));
  const authorsById = new Map((authors ?? []).map((u) => [u.id, u.full_name]));

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

  const feedPosts: FamilyPost[] = (posts ?? []).map((post) => {
    const recipients = (postChildren ?? [])
      .filter((row) => row.post_id === post.id)
      .map((row) => childrenById.get(row.child_id))
      .filter((child): child is FamilyChild => Boolean(child));

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

    const uiType = ENUM_TO_UI[post.type] ?? "Anuncio";

    return {
      id: post.id,
      type: uiType,
      title: post.title,
      body: post.body,
      timeLabel: formatTime(post.published_at),
      roomName: post.room_id ? roomName : null,
      author: authorsById.get(post.author_id) ?? "Staff",
      para: paraText(recipients),
      recipientIds: (postChildren ?? [])
        .filter((row) => row.post_id === post.id)
        .map((row) => row.child_id),
      child: recipients[0] ?? null,
      photos,
      badge: badgeForType(uiType),
    };
  });

  const firstName = user.full_name.split(" ")[0];

  return {
    context: {
      userFullName: user.full_name,
      greeting: `Hola, ${firstName}`,
      roomName,
      currentDateLabel: formatCurrentDate(),
    },
    children,
    posts: feedPosts,
  };
}