"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import type { MemberStatus } from "@/lib/supabase/types";

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

const MEMBER_STATUSES: readonly MemberStatus[] = [
  "active",
  "inactive",
  "suspended",
  "invited",
];

const memberSchema = z.object({
  full_name: z.string().trim().min(2, "Escribe un nombre.").max(160),
  email: z.string().trim().email("Correo inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  status: z.enum(MEMBER_STATUSES as [MemberStatus, ...MemberStatus[]]).default("active"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

function parse(formData: FormData) {
  return memberSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    status: formData.get("status") || "active",
    notes: formData.get("notes"),
  });
}

export async function createMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org } = await requireOrg();

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();

  const limit = PLAN_CATALOG[org.plan].limits.members;
  if (limit !== -1) {
    const { count } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id);
    if ((count ?? 0) >= limit) {
      return {
        error: `Tu plan permite ${limit} miembros. Mejora tu plan para agregar más.`,
      };
    }
  }

  const d = parsed.data;
  const { error } = await supabase.from("members").insert({
    org_id: org.id,
    full_name: d.full_name,
    email: d.email || null,
    phone: d.phone || null,
    company: d.company || null,
    status: d.status,
    credit_minutes: 0,
    notes: d.notes || null,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un miembro con ese correo." };
    }
    return { error: "No se pudo crear el miembro." };
  }

  revalidatePath("/members");
  return { ok: true };
}

export async function updateMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org } = await requireOrg();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Miembro no encontrado." };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase
    .from("members")
    .update({
      full_name: d.full_name,
      email: d.email || null,
      phone: d.phone || null,
      company: d.company || null,
      status: d.status,
      notes: d.notes || null,
    })
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) return { error: "No se pudo actualizar el miembro." };

  revalidatePath("/members");
  return { ok: true };
}
