import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function normalizeUsername(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function fallbackUsername(user: User) {
  const metaName = normalizeUsername(user.user_metadata?.display_name);
  if (metaName) return metaName;
  return normalizeUsername(user.email?.split("@")[0]);
}

export async function ensureProfileForUser(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (error) throw error;
  let created = false;

  if (!data?.length) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        display_name: fallbackUsername(user),
        access_status: "pending",
      });

    if (insertError && insertError.code !== "23505") throw insertError;
    created = true;
  }

  return created;
}

export async function getProfileUsername(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id);

  if (error) throw error;

  const savedUsername = normalizeUsername(data?.[0]?.display_name);

  return {
    savedUsername,
    greetingUsername: savedUsername || fallbackUsername(user),
  };
}

export async function persistProfileUsername(user: User, username: string) {
  const next = normalizeUsername(username);

  const { data: updatedRows, error: updateError } = await supabase
    .from("profiles")
    .update({ display_name: next })
    .eq("user_id", user.id)
    .select("display_name");

  if (updateError) throw updateError;

  if (!updatedRows?.length) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, display_name: next });

    if (insertError) throw insertError;
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: next },
  });

  if (authError) throw authError;

  return next;
}