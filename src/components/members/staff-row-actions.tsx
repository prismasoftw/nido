"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { removeStaffAction, updateRoleAction } from "@/lib/actions/team";
import { ROLE_LABELS } from "@/lib/constants";
import type { MemberRole } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSIGNABLE: MemberRole[] = ["admin", "manager", "reception"];

export function StaffRowActions({
  userId,
  role,
}: {
  userId: string;
  role: MemberRole;
}) {
  const [pending, startTransition] = useTransition();

  if (role === "owner") {
    return (
      <span className="text-muted-foreground text-sm">
        {ROLE_LABELS.owner}
      </span>
    );
  }

  function changeRole(next: string) {
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set("role", next);
    startTransition(() => updateRoleAction(fd));
  }

  function remove() {
    const fd = new FormData();
    fd.set("user_id", userId);
    startTransition(() => removeStaffAction(fd));
  }

  return (
    <div className="flex items-center gap-1">
      {pending && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
      <Select value={role} onValueChange={changeRole} disabled={pending}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ASSIGNABLE.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive size-8"
        disabled={pending}
        onClick={remove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
