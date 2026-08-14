import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Heart, MessageCircle } from "lucide-react";
import MobileHeader from "@/components/mobile-header";
import Sidebar from "@/components/sidebar";
import { NewPostDialog } from "@/components/new-post-dialog";
import { badgeForType, getFeed, type FeedPost } from "@/utils/feed";

function PostFooter({ likes, comments }: { likes: number; comments: number }) {
  return (
    <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-3.5">
      <span className="flex items-center gap-[7px] text-sm font-bold text-coral-dark">
        <Heart size={19} fill="#E0654A" />
        {likes}
      </span>
      <Link
        href="#"
        className="flex items-center gap-[7px] text-sm font-bold text-ink-muted"
      >
        <MessageCircle size={18} />
        {comments}
      </Link>
      <span className="flex-1" />
      <Link href="#" className="text-sm font-extrabold text-coral-darker">
        Editar
      </Link>
    </div>
  );
}

function FeedCard({ post }: { post: FeedPost }) {
  const badge = badgeForType(post.type);
  const recipient = post.recipients[0];
  const headerName =
    post.title ?? (recipient?.fullName.split(" ")[0] ?? "Publicación");

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        {recipient ? (
          <div
            className="flex size-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold"
            style={{
              backgroundColor: recipient.avatarBg,
              color: recipient.avatarColor,
            }}
          >
            {recipient.initials}
          </div>
        ) : (
          <div className="flex size-11 flex-none items-center justify-center rounded-full bg-indigo-bg text-indigo">
            <MessageCircle size={20} />
          </div>
        )}
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {headerName}
          </div>
          <div className="text-[12.5px] text-ink-faint">
            {post.timeLabel} · publicado por vos
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

      <PostFooter likes={0} comments={0} />
    </article>
  );
}

export default async function Home() {
  const feed = await getFeed();
  if (!feed) redirect("/login");

  const { context } = feed;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MobileHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-4 py-6 pb-20 lg:px-10 lg:py-[34px] lg:pb-20">
            <div className="mb-6">
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-coral-brand">
                GUARDERÍA · SALA {context.roomName.toUpperCase()}
              </div>
              <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
                {context.greeting}
              </h1>
              <p className="mt-[5px] text-[14.5px] text-ink-muted">
                {context.activeKidsCount} niños · {context.currentDateLabel}
              </p>
            </div>

            <NewPostDialog>
              <button
                type="button"
                className="mb-6 flex w-full items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
              >
                <div className="flex size-10 flex-none items-center justify-center rounded-full bg-coral font-display text-base font-semibold text-white">
                  {context.userInitials}
                </div>
                <span className="flex-1 text-[15px] text-ink-faint">
                  Compartí un momento…
                </span>
                <span className="flex size-[38px] items-center justify-center rounded-[12px] bg-peach text-coral-dark">
                  <Camera size={19} />
                </span>
              </button>
            </NewPostDialog>

            <div className="flex flex-col gap-4">
              {feed.posts.map((post) => (
                <FeedCard key={post.id} post={post} />
              ))}
              {feed.posts.length === 0 && (
                <p className="py-8 text-center text-[14.5px] text-ink-muted">
                  Todavía no hay publicaciones.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}