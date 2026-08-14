"use client";

import { useState } from "react";
import { Heart, Megaphone, MessageCircle } from "lucide-react";
import type { FamilyChild, FamilyPost } from "@/utils/family-feed";

function chipClass(active: boolean) {
  return `flex items-center gap-2 rounded-full border-[1.5px] px-[15px] py-[7px] text-[14px] font-bold transition ${
    active
      ? "border-ink bg-ink text-white"
      : "border-line bg-surface text-ink-soft"
  }`;
}

function PostFooter() {
  return (
    <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-3.5">
      <span className="flex items-center gap-[7px] text-sm font-bold text-coral-dark">
        <Heart size={19} fill="#E0654A" />
        0
      </span>
      <span className="flex items-center gap-[7px] text-sm font-bold text-ink-muted">
        <MessageCircle size={18} />
        0
      </span>
    </div>
  );
}

function FamilyPostCard({ post }: { post: FamilyPost }) {
  const isAnnouncement = post.type === "Anuncio";
  const badge = post.badge;

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        {isAnnouncement ? (
          <div className="flex size-11 flex-none items-center justify-center rounded-full bg-indigo-bg text-indigo">
            <Megaphone size={20} />
          </div>
        ) : post.child ? (
          <div
            className="flex size-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold"
            style={{
              backgroundColor: post.child.avatarBg,
              color: post.child.avatarColor,
            }}
          >
            {post.child.initials}
          </div>
        ) : null}

        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {isAnnouncement
              ? (post.title ?? "Anuncio")
              : (post.child?.firstName ?? "Publicación")}
          </div>
          <div className="text-[12.5px] text-ink-faint">
            {post.timeLabel} · Maestra {post.author}
            {!isAnnouncement && post.roomName
              ? ` · Sala ${post.roomName}`
              : ""}
          </div>
        </div>
        <div
          className="flex items-center gap-[7px] rounded-full px-3 py-1.5"
          style={{ backgroundColor: badge.bg }}
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: badge.dot }}
          />
          <span
            className="text-xs font-extrabold tracking-[.5px]"
            style={{ color: badge.text }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <div className="mb-2.5 text-[12.5px] text-ink-faint">{post.para}</div>

      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">
        {post.body}
      </p>

      {post.photos.length > 0 && (
        <div
          className={`mt-[14px] grid gap-2 ${
            post.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {post.photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt="Foto de la publicación"
              className={`w-full rounded-[16px] border border-line object-cover ${
                post.photos.length === 1 ? "max-h-[220px]" : "aspect-square"
              }`}
            />
          ))}
        </div>
      )}

      <PostFooter />
    </article>
  );
}

export default function FamilyFeed({
  kids,
  posts,
}: {
  kids: FamilyChild[];
  posts: FamilyPost[];
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const visiblePosts =
    selectedChildId === null
      ? posts
      : posts.filter((post) => post.recipientIds.includes(selectedChildId));

  return (
    <div>
      <div className="mb-[22px] flex flex-wrap gap-[10px]">
        <button
          type="button"
          aria-pressed={selectedChildId === null}
          onClick={() => setSelectedChildId(null)}
          className={chipClass(selectedChildId === null)}
        >
          Todos
        </button>
        {kids.map((child) => (
          <button
            key={child.id}
            type="button"
            aria-pressed={selectedChildId === child.id}
            onClick={() => setSelectedChildId(child.id)}
            className={chipClass(selectedChildId === child.id)}
          >
            <span
              className="flex size-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
              style={{
                backgroundColor: child.avatarBg,
                color: child.avatarColor,
              }}
            >
              {child.initials}
            </span>
            {child.firstName}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {visiblePosts.map((post) => (
          <FamilyPostCard key={post.id} post={post} />
        ))}
        {visiblePosts.length === 0 && (
          <p className="py-8 text-center text-[14.5px] text-ink-muted">
            Todavía no hay publicaciones.
          </p>
        )}
      </div>
    </div>
  );
}