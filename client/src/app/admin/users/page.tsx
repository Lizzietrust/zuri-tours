"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminUsers,
  useChangeRole,
  useDeactivateUser,
  useRestoreUser,
} from "@/hooks/useAdmin";
import type { AdminUser } from "@/services/admin";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import {
  BTN,
  Badge,
  ConfirmDialog,
  INPUT,
  PageHeader,
  RowsState,
  TD,
  TH,
  TableCard,
  Tabs,
} from "@/components/admin/ui";

type View = "active" | "deleted";
type Role = AdminUser["role"];

const ROLES: Role[] = ["user", "guide", "lead-guide", "admin"];

const SEARCH_DEBOUNCE_MS = 400;

type PendingRole = { user: AdminUser; role: Role } | null;

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [view, setView] = useState<View>("active");
  const [role, setRole] = useState("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AdminUser | null>(null);
  const [pendingRole, setPendingRole] = useState<PendingRole>(null);

  /* Search as you type: wait for a short pause, then apply and go to page 1. */
  useEffect(() => {
    const term = q.trim();

    if (term === search) return;

    const timer = setTimeout(() => {
      setSearch(term);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [q, search]);

  const { data, isLoading, isError, refetch } = useAdminUsers({
    status: view,
    role,
    q: search,
    page,
    limit: 15,
  });
  const changeRole = useChangeRole();
  const deactivate = useDeactivateUser();
  const restore = useRestoreUser();

  const users = data?.data.users ?? [];

  const confirmRoleChange = () => {
    if (!pendingRole) return;

    changeRole.mutate(
      { id: pendingRole.user._id, role: pendingRole.role },
      { onSettled: () => setPendingRole(null) },
    );
  };

  const confirmRestore = () => {
    if (!restoreTarget) return;

    restore.mutate(restoreTarget._id, {
      onSettled: () => setRestoreTarget(null),
    });
  };

  const roleDescription = pendingRole
    ? pendingRole.role === "admin"
      ? `${pendingRole.user.name} will get full admin access, including managing users, tours, reviews and bookings.`
      : pendingRole.user.role === "admin"
        ? `${pendingRole.user.name} will lose admin access and be set to ${pendingRole.role}.`
        : `${pendingRole.user.name}'s role will change from ${pendingRole.user.role} to ${pendingRole.role}.`
    : "";

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="To add a guide, ask them to sign up, then set their role here."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs<View>
          value={view}
          onChange={(v) => {
            setView(v);
            setPage(1);
          }}
          options={[
            { value: "active", label: "Active" },
            { value: "deleted", label: "Deactivated" },
          ]}
        />
        <select
          aria-label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className={INPUT}
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          aria-label="Search users"
          className={`${INPUT} ml-auto w-full sm:w-72`}
        />
      </div>

      {isError && (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Couldn&apos;t load users.{" "}
          <button className="font-semibold underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <TableCard>
        <thead className="bg-gray-50">
          <tr>
            <th className={TH}>User</th>
            <th className={TH}>Role</th>
            <th className={TH}>Joined</th>
            <th className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <RowsState
            loading={isLoading}
            empty={!isLoading && users.length === 0}
            cols={4}
            message="No users found."
          />
          {users.map((u) => {
            const isMe = u._id === me?._id;

            return (
              <tr key={u._id}>
                <td className={TD}>
                  <p className="font-semibold text-gray-900">
                    {u.name} {isMe && <Badge tone="blue">you</Badge>}
                  </p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className={TD}>
                  {view === "active" ? (
                    <select
                      aria-label={`Role for ${u.name}`}
                      value={u.role}
                      disabled={isMe || changeRole.isPending}
                      onChange={(e) => {
                        const next = e.target.value as Role;

                        if (next !== u.role)
                          setPendingRole({ user: u, role: next });
                      }}
                      className={`${INPUT} py-1.5`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{u.role}</Badge>
                  )}
                </td>
                <td className={TD}>{formatDate(u.createdAt)}</td>
                <td className={`${TD} text-right`}>
                  {view === "active" ? (
                    <button
                      className={BTN.danger}
                      disabled={isMe}
                      onClick={() => setTarget(u)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className={BTN.ok}
                      disabled={restore.isPending}
                      onClick={() => setRestoreTarget(u)}
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      <Pagination page={page} pages={data?.pages ?? 1} onChange={setPage} />

      {/* Role change confirmation */}
      <ConfirmDialog
        open={pendingRole !== null}
        loading={changeRole.isPending}
        title={`Change role to ${pendingRole?.role ?? ""}?`}
        description={roleDescription}
        confirmLabel="Change role"
        onConfirm={confirmRoleChange}
        onClose={() => !changeRole.isPending && setPendingRole(null)}
      />

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={target !== null}
        loading={deactivate.isPending}
        title={`Deactivate ${target?.name}?`}
        description="They won't be able to log in, and they'll be removed from assigned tours. You can restore the account later."
        confirmLabel="Deactivate"
        onConfirm={() =>
          target &&
          deactivate.mutate(target._id, { onSuccess: () => setTarget(null) })
        }
        onClose={() => !deactivate.isPending && setTarget(null)}
      />

      {/* Restore confirmation */}
      <ConfirmDialog
        open={restoreTarget !== null}
        loading={restore.isPending}
        title={`Restore ${restoreTarget?.name}?`}
        description="They'll be able to log in again. Tours they were assigned to before being deactivated are not re-assigned automatically."
        confirmLabel="Restore"
        onConfirm={confirmRestore}
        onClose={() => !restore.isPending && setRestoreTarget(null)}
      />
    </>
  );
}
