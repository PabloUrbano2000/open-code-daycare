import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const claimsResult = await supabase.auth.getClaims();
  const userId = claimsResult.data?.claims?.sub
    ? claimsResult.data.claims.sub
    : null;

  let role: "staff" | "parent" | null = null;
  if (userId) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    role = data?.role ?? null;
  }

  const { pathname } = request.nextUrl;

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  const isStaffRoute =
    pathname === "/staff" || pathname.startsWith("/staff/");
  const isFamilyRoute = pathname === "/family";

  if (isStaffRoute || isFamilyRoute) {
    if (!userId) {
      supabaseResponse = redirect("/login");
    } else if (isStaffRoute && role !== "staff") {
      supabaseResponse = redirect("/family");
    } else if (isFamilyRoute && role !== "parent") {
      supabaseResponse = redirect("/staff");
    }
  } else if (pathname === "/") {
    if (!userId) {
      supabaseResponse = redirect("/login");
    } else {
      supabaseResponse = redirect(role === "parent" ? "/family" : "/staff");
    }
  }

  if (pathname === "/login" && userId) {
    supabaseResponse = redirect(role === "parent" ? "/family" : "/staff");
  }

  return { supabase, supabaseResponse };
}