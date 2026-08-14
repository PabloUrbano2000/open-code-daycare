"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = createClient(await cookies());

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const claims = await supabase.auth.getClaims();
  const userId = claims.data?.claims?.sub;
  if (userId) {
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    redirect(user?.role === "parent" ? "/family" : "/staff");
  }

  redirect("/");
}
