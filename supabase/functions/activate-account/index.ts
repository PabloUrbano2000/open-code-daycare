import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "method" }, 405);
  }

  const { code, email, password } = await req.json().catch(() => ({}));

  if (
    typeof code !== "string" || typeof email !== "string" ||
    typeof password !== "string" || !password
  ) {
    return json({ error: "invalid" }, 400);
  }

  const normalizedCode = code.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (password.length < 6) {
    return json({ error: "password" }, 400);
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, child_id, full_name, email, relationship, status, expires_at, children!inner(room_id, rooms!inner(daycare_id))")
    .eq("code", normalizedCode)
    .single();

  if (invitationError || !invitation) {
    return json({ error: "invalid" }, 404);
  }

  if (invitation.email.toLowerCase() !== normalizedEmail) {
    return json({ error: "email_mismatch" }, 400);
  }

  const daycareId = invitation.children?.rooms?.daycare_id;

  if (!daycareId) {
    return json({ error: "invalid" }, 400);
  }

  if (invitation.status !== "pending") {
    return json({ error: "used" }, 409);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return json({ error: "expired" }, 410);
  }

  const { data: created, error: createUserError } = await supabase.auth.admin
    .createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        daycare_id: daycareId,
        role: "parent",
        full_name: invitation.full_name,
      },
    });

  if (createUserError || !created?.user?.id) {
    return json({ error: "create_user" }, 400);
  }

  const { error: linkError } = await supabase.from("parent_children").insert({
    parent_id: created.user.id,
    child_id: invitation.child_id,
    relationship: invitation.relationship,
  });

  if (linkError) {
    return json({ error: "link_failed" }, 400);
  }

  const { data, error: updateError } = await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)
    .eq("status", "pending")
    .select("id");

  if (updateError || !data || data.length === 0) {
    return json({ error: "used" }, 409);
  }

  return json({ ok: true });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
