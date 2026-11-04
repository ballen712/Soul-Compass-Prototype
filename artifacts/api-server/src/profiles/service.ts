import { createClient } from "@supabase/supabase-js";

export type Principal = { id: string; lastSignInAt: string | null };
export type ProfileRecord = { profile: unknown; preferences: unknown; version: number };
export interface ProfileService {
  authenticate(token: string): Promise<Principal | null>;
  read(token: string, userId: string): Promise<ProfileRecord | null>;
  create(token: string, data: { profile: unknown; preferences: unknown }): Promise<ProfileRecord | null>;
  update(token: string, userId: string, version: number, data: { profile: unknown; preferences: unknown }): Promise<ProfileRecord | null>;
  removeProfile(token: string, userId: string): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
}
const fields = "profile,preferences,version";
function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Cloud account service is not configured.");
  return { url, key };
}
function userClient(token: string) {
  const { url, key } = config();
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
export const supabaseProfiles: ProfileService = {
  async authenticate(token) {
    const { data, error } = await userClient(token).auth.getUser(token);
    if (error) {
      if (!error.status || error.status >= 500 || error.status === 429) throw new Error("Auth service unavailable.");
      return null;
    }
    return data.user ? { id: data.user.id, lastSignInAt: data.user.last_sign_in_at ?? null } : null;
  },
  async read(token, id) {
    const { data, error } = await userClient(token).from("profiles").select(fields).eq("user_id", id).maybeSingle();
    if (error) throw new Error("Profile lookup failed.");
    return data;
  },
  async create(token, value) {
    // No user_id is supplied: the database derives it using auth.uid().
    const { data, error } = await userClient(token).from("profiles").insert(value).select(fields).single();
    if (error?.code === "23505") return null;
    if (error) throw new Error("Profile creation failed.");
    return data;
  },
  async update(token, id, version, value) {
    const { data, error } = await userClient(token).from("profiles").update(value).eq("user_id", id).eq("version", version).select(fields).maybeSingle();
    if (error) throw new Error("Profile update failed.");
    return data;
  },
  async removeProfile(token, id) {
    const { error } = await userClient(token).from("profiles").delete().eq("user_id", id);
    if (error) throw new Error("Profile deletion failed.");
  },
  async deleteAccount(id) {
    const { url } = config();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("Account deletion is not configured.");
    // Administrative credential exists only in this server module.
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error("Account deletion failed.");
  },
};
