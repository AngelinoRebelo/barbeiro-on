"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import { statusLabel } from "@/lib/utils";

export type RecentAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  shopName: string | null;
};

export function AdminRecentAccounts({ me, users }: { me: string; users: RecentAccount[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function remove(user: RecentAccount) {
    const warn =
      user.role === "BARBER"
        ? "Excluir esta unidade também apaga as contas de clientes vinculadas. Esta ação não pode ser desfeita."
        : "Excluir este usuário? Esta ação não pode ser desfeita.";
    if (!confirm(warn)) return;
    setBusy(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) {
      alert(data.error || "Não foi possível excluir.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 px-4 py-3">
          <Link href={`/admin/usuarios/${u.id}`} className="min-w-0 flex-1 hover:text-gold">
            <p className="font-medium">{u.name}</p>
            <p className="truncate text-sm text-[#8b93a7]">
              {u.email}
              {u.shopName ? ` · ${u.shopName}` : ""}
            </p>
          </Link>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Badge tone={u.status === "ACTIVE" ? "cyan" : u.status === "SUSPENDED" ? "danger" : "muted"}>
              {statusLabel(u.role)} · {statusLabel(u.status)}
            </Badge>
            {u.role !== "ADMIN" && u.id !== me && (
              <Button variant="danger" disabled={busy === u.id} onClick={() => remove(u)}>
                Excluir
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
