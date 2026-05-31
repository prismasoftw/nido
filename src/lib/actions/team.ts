"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlanCatalog } from "@/lib/plans-server";
import type { MemberRole } from "@/lib/supabase/types";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
} | null;

function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const ASSIGNABLE_ROLES: readonly MemberRole[] = ["admin", "manager", "reception"];

const inviteSchema = z.object({
  email: z.string().trim().email("Correo inválido."),
  role: z.enum(ASSIGNABLE_ROLES as [MemberRole, ...MemberRole[]]),
});

export async function inviteMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") {
    return { error: "No tienes permisos para invitar." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();

  const catalog = await getPlanCatalog();
  const limit = catalog[org.plan].limits.staff;
  if (limit !== -1) {
    const [{ count: staffCount }, { count: pendingCount }] = await Promise.all([
      supabase
        .from("organization_members")
        .select("user_id", { count: "exact", head: true })
        .eq("org_id", org.id),
      supabase
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "pending"),
    ]);
    if ((staffCount ?? 0) + (pendingCount ?? 0) >= limit) {
      return {
        error: `Tu plan permite ${limit} usuarios. Mejora tu plan para invitar más.`,
      };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  const { error } = await supabase.from("invitations").insert({
    org_id: org.id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    status: "pending",
    invited_by: user?.id ?? null,
    expires_at: expires.toISOString(),
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "Ya invitaste a ese correo." };
    }
    return { error: "No se pudo crear la invitación." };
  }

  revalidatePath("/members");
  return { ok: true };
}

export async function updateRoleAction(formData: FormData): Promise<void> {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") return;

  const userId = String(formData.get("user_id") ?? "");
  const nextRole = String(formData.get("role") ?? "") as MemberRole;
  if (!userId || !ASSIGNABLE_ROLES.includes(nextRole)) return;

  const supabase = await createClient();
  // Never reassign the owner's role.
  await supabase
    .from("organization_members")
    .update({ role: nextRole })
    .eq("org_id", org.id)
    .eq("user_id", userId)
    .neq("role", "owner");

  revalidatePath("/members");
}

export async function removeStaffAction(formData: FormData): Promise<void> {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") return;

  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const supabase = await createClient();
  await supabase
    .from("organization_members")
    .delete()
    .eq("org_id", org.id)
    .eq("user_id", userId)
    .neq("role", "owner");

  revalidatePath("/members");
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("org_id", org.id);

  revalidatePath("/members");
}
