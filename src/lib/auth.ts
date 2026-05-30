import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { MemberRole, Organization } from "@/lib/supabase/types";

const ACTIVE_ORG_COOKIE = "active_org";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export type OrgMembership = {
  org: Organization;
  role: MemberRole;
};

export async function getUserOrgs(): Promise<OrgMembership[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(*)")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const rows = data as unknown as {
    role: MemberRole;
    organizations: Organization | null;
  }[];

  return rows
    .filter((row) => row.organizations)
    .map((row) => ({
      role: row.role,
      org: row.organizations as Organization,
    }));
}

/** Resolve the active org from the cookie, falling back to the first membership. */
export async function getActiveOrg(): Promise<OrgMembership | null> {
  const orgs = await getUserOrgs();
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const match = activeId ? orgs.find((o) => o.org.id === activeId) : undefined;
  return match ?? orgs[0];
}

export async function requireOrg(): Promise<OrgMembership> {
  await requireUser();
  const active = await getActiveOrg();
  if (!active) redirect("/onboarding");
  return active;
}

export function isAdminRole(role: MemberRole) {
  return role === "owner" || role === "admin";
}

/** True when the signed-in user is on the platform-admin allow-list. */
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!(await isPlatformAdmin())) redirect("/dashboard");
  return user;
}

/** Display name for the signed-in user, from metadata with email fallback. */
export function userDisplayName(user: {
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
}): string {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Usuario"
  );
}
