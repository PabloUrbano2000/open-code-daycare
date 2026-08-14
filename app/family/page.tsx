import { redirect } from "next/navigation";
import MobileHeader from "@/components/mobile-header";
import Sidebar from "@/components/sidebar";
import FamilyFeed from "@/components/family-feed";
import { getFamilyFeed } from "@/utils/family-feed";

export default async function FamilyPage() {
  const feed = await getFamilyFeed();
  if (!feed) redirect("/login");

  const { context } = feed;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MobileHeader role="parent" />

      <div className="flex flex-1">
        <Sidebar activeItem="feed" />

        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[720px] px-4 py-6 pb-20 lg:px-10 lg:py-[34px] lg:pb-20">
            <div className="mb-5">
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-coral-brand">
                TU FAMILIA
              </div>
              <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
                {context.greeting}
              </h1>
              <p className="mt-[5px] text-[14.5px] text-ink-muted">
                Sala {context.roomName} · {context.currentDateLabel}
              </p>
            </div>

            <FamilyFeed kids={feed.children} posts={feed.posts} />
          </div>
        </main>
      </div>
    </div>
  );
}