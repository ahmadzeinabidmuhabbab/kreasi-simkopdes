"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import {
  DataTablePagination,
  EmptyState,
  LoadingState,
  MaterialIcon,
  SortButton,
  type SortOrder,
} from "@/components/dashboard/DashboardDataTable";

type UserSortField = "name" | "username" | "role" | "email" | "active" | "createdAt";

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface UserFormState {
  name: string;
  username: string;
  password: string;
  role: string;
  email: string;
}

const ROLES = ["Super Admin", "Operator", "Viewer"];

const roleColors: Record<string, string> = {
  "Super Admin": "border-rose-200 bg-rose-100 text-rose-700",
  Operator: "border-sky-200 bg-sky-100 text-sky-700",
  Viewer: "border-amber-200 bg-amber-100 text-amber-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <button type="button" aria-label="Tutup modal" className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-[min(30rem,100%)] rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-lg shadow-2xl">
        <div className="mb-md flex items-center justify-between gap-md">
          <h2 className="text-lg font-extrabold text-on-surface">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="grid size-10 place-items-center rounded-xl text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
          >
            <MaterialIcon className="text-[20px]">close</MaterialIcon>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: ReactNode }) {
  return (
    <div className="space-y-xs">
      <label className="text-xs font-extrabold uppercase tracking-normal text-on-surface-variant">{label}</label>
      <div className="flex min-h-11 items-center gap-sm rounded-xl border border-outline-variant/25 bg-surface-container-low px-md transition focus-within:border-primary focus-within:bg-surface-container-lowest">
        <MaterialIcon className="text-[18px] text-on-surface-variant">{icon}</MaterialIcon>
        {children}
      </div>
    </div>
  );
}

function UserForm({
  form,
  editMode,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
}: {
  form: UserFormState;
  editMode: boolean;
  submitting: boolean;
  submitLabel: string;
  onChange: (form: UserFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-md">
      <Field label="Nama Lengkap" icon="badge">
        <input
          type="text"
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder="Nama lengkap"
          required
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
        />
      </Field>
      <Field label="Username" icon="person">
        <input
          type="text"
          value={form.username}
          onChange={(event) => onChange({ ...form, username: event.target.value })}
          placeholder="Username login"
          required
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
        />
      </Field>
      <Field label={editMode ? "Password Baru" : "Password"} icon="lock">
        <input
          type="password"
          value={form.password}
          onChange={(event) => onChange({ ...form, password: event.target.value })}
          placeholder={editMode ? "Kosongkan jika tidak diubah" : "Password"}
          required={!editMode}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
        />
      </Field>
      <Field label="Email" icon="mail">
        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange({ ...form, email: event.target.value })}
          placeholder="email@kreasi.id"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
        />
      </Field>
      <div className="space-y-xs">
        <p className="text-xs font-extrabold uppercase tracking-normal text-on-surface-variant">Role</p>
        <div className="flex flex-wrap gap-xs">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onChange({ ...form, role })}
              className={`min-h-10 rounded-xl border px-md text-xs font-extrabold transition ${
                form.role === role
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-outline-variant/25 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center gap-xs rounded-xl bg-primary px-md py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
      >
        <MaterialIcon className={`text-[18px] ${submitting ? "animate-spin" : ""}`}>
          {submitting ? "sync" : "save"}
        </MaterialIcon>
        {submitting ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: "primary" | "amber" | "sky" | "danger";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-secondary-container/35 text-on-secondary-container",
    sky: "bg-sky-100 text-sky-700",
    danger: "bg-red-100 text-red-700",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-sm rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-sm shadow-sm">
      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
        <MaterialIcon filled className="text-xl">
          {icon}
        </MaterialIcon>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-normal text-on-surface-variant">{label}</p>
        <p className="mt-0.5 break-words text-xl font-extrabold text-on-surface">{value}</p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{helper}</p>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<UserSortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [form, setForm] = useState<UserFormState>({
    name: "",
    username: "",
    password: "",
    role: "Operator",
    email: "",
  });

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Gagal memuat data user");
      }
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data user");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim().toLowerCase());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filteredUsers = useMemo(() => {
    const filtered = search
      ? users.filter((user) =>
          [user.name, user.username, user.role, user.email].some((value) => value.toLowerCase().includes(search)),
        )
      : users;

    return [...filtered].sort((a, b) => {
      const aValue = String(a[sortBy]).toLowerCase();
      const bValue = String(b[sortBy]).toLowerCase();
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }, [search, sortBy, sortOrder, users]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const activeUsers = users.filter((user) => user.active).length;
  const roleCount = new Set(users.map((user) => user.role)).size;

  const handleSort = (field: UserSortField) => {
    setPage(1);
    if (field === sortBy) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortOrder("asc");
  };

  const openAdd = () => {
    setForm({ name: "", username: "", password: "", role: "Operator", email: "" });
    setShowAddModal(true);
  };

  const openEdit = (user: User) => {
    setForm({ name: user.name, username: user.username, password: "", role: user.role, email: user.email });
    setEditUser(user);
  };

  const handleSubmitAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      showToast(data.message);
      setShowAddModal(false);
      await fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editUser.id, ...form }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      showToast(data.message);
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      showToast(data.message);
      await fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteUser.id }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      showToast(data.message);
      setDeleteUser(null);
      await fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    }
  };

  return (
    <div className="dashboard-page dashboard-page-users flex flex-col gap-md">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[1100] flex items-center gap-sm rounded-2xl border px-md py-sm text-sm font-semibold shadow-2xl ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <MaterialIcon filled className="text-[20px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </MaterialIcon>
          {toast.msg}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-[#315f25] to-[#19380f] p-lg text-white shadow-[0_18px_48px_-30px_rgba(24,53,15,0.85)]">
        <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-sm inline-flex items-center gap-xs rounded-full border border-white/15 bg-white/10 px-sm py-1 text-xs font-bold text-white/80">
              <MaterialIcon filled className="text-[16px]">
                manage_accounts
              </MaterialIcon>
              Access Control
            </div>
            <h1 className="text-2xl font-extrabold text-white">Data User</h1>
            <p className="mt-xs max-w-3xl text-sm leading-relaxed text-white/78">
              Kelola akun operasional, role, status aktif, dan akses dashboard dengan tampilan tabel yang konsisten.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex min-h-11 items-center justify-center gap-xs rounded-xl bg-white px-md py-2 text-sm font-extrabold text-primary shadow-sm transition hover:bg-white/90"
          >
            <MaterialIcon className="text-[18px]">person_add</MaterialIcon>
            Tambah User
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-gutter xl:grid-cols-4">
        <KpiCard label="Total User" value={users.length.toLocaleString("id-ID")} helper="akun terdaftar" icon="group" tone="primary" />
        <KpiCard label="User Aktif" value={activeUsers.toLocaleString("id-ID")} helper="dapat mengakses sistem" icon="verified_user" tone="sky" />
        <KpiCard label="Nonaktif" value={(users.length - activeUsers).toLocaleString("id-ID")} helper="akses dinonaktifkan" icon="block" tone={users.length - activeUsers > 0 ? "danger" : "amber"} />
        <KpiCard label="Role" value={roleCount.toLocaleString("id-ID")} helper="tingkat akses tersedia" icon="admin_panel_settings" tone="amber" />
      </section>

      {error ? (
        <section className="rounded-2xl border border-error/25 bg-error-container/45 p-md text-error">
          <div className="flex items-start gap-sm">
            <MaterialIcon filled className="text-[22px]">
              error
            </MaterialIcon>
            <div>
              <p className="font-extrabold">Data user belum bisa dimuat</p>
              <p className="mt-xs text-sm">{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative isolate flex min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm">
        <div className="shrink-0 flex flex-col gap-sm p-md lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Tabel Data User</h2>
            <p className="text-sm text-on-surface-variant">{total.toLocaleString("id-ID")} user sesuai pencarian saat ini</p>
          </div>
          <label className="flex min-h-11 w-full items-center gap-xs rounded-xl border border-outline-variant/20 bg-surface-container-low px-sm text-sm shadow-sm lg:w-[22rem]">
            <MaterialIcon className="text-[18px] text-on-surface-variant">search</MaterialIcon>
            <span className="sr-only">Cari data user</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama, username, role, email..."
              className="min-w-0 flex-1 bg-transparent py-2 font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Bersihkan pencarian user"
                className="grid size-8 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
              >
                <MaterialIcon className="text-[16px]">close</MaterialIcon>
              </button>
            ) : null}
          </label>
        </div>

        <div className="max-w-full overflow-hidden" style={{ minHeight: "38rem" }}>
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[25%]" />
              <col className="users-desktop-col w-[15%]" />
              <col className="w-[14%]" />
              <col className="users-desktop-col w-[22%]" />
              <col className="w-[10%]" />
              <col className="users-desktop-col w-[8%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead className="shadow-[0_12px_24px_rgba(47,63,38,0.18)]">
              <tr className="border-y" style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="name" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Nama
                  </SortButton>
                </th>
                <th className="users-desktop-col px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="username" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Username
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="role" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Role
                  </SortButton>
                </th>
                <th className="users-desktop-col px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="email" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Email
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="active" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Status
                  </SortButton>
                </th>
                <th className="users-desktop-col px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="createdAt" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Dibuat
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl">
                    <LoadingState label="Memuat data user" />
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl">
                    <EmptyState title="Tidak ada user" text="Tidak ada user yang cocok dengan pencarian saat ini." icon="manage_accounts" />
                  </td>
                </tr>
              ) : (
                pageItems.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant/10 transition hover:bg-surface-container-low">
                    <td className="px-md py-3">
                      <div className="flex min-w-0 items-center gap-sm">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-xs font-extrabold text-white">
                          {initials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="break-words font-extrabold leading-snug text-on-surface">{user.name}</p>
                          <p className="text-[11px] text-on-surface-variant">ID {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="users-desktop-col px-md py-3 font-mono text-xs font-bold text-on-surface-variant">@{user.username}</td>
                    <td className="px-md py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-extrabold ${roleColors[user.role] ?? "border-outline-variant/25 bg-surface-container text-on-surface-variant"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="users-desktop-col px-md py-3">
                      <p className="break-words text-xs font-bold leading-relaxed text-on-surface-variant">{user.email || "-"}</p>
                    </td>
                    <td className="px-md py-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(user)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-extrabold transition hover:opacity-80 ${
                          user.active
                            ? "border-primary/25 bg-primary/10 text-primary"
                            : "border-outline-variant/30 bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${user.active ? "bg-primary" : "bg-outline"}`} />
                        {user.active ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="users-desktop-col px-md py-3 text-xs font-bold leading-relaxed text-on-surface-variant">{formatDate(user.createdAt)}</td>
                    <td className="px-md py-3">
                      <div className="flex flex-wrap gap-xs">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          aria-label={`Edit ${user.name}`}
                          className="grid size-9 place-items-center rounded-lg border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-primary hover:text-white"
                        >
                          <MaterialIcon className="text-[16px]">edit</MaterialIcon>
                        </button>
                        {user.id !== 1 ? (
                          <button
                            type="button"
                            onClick={() => setDeleteUser(user)}
                            aria-label={`Hapus ${user.name}`}
                            className="grid size-9 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white"
                          >
                            <MaterialIcon className="text-[16px]">delete</MaterialIcon>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          loading={loading}
          itemLabel="user"
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </section>

      {showAddModal ? (
        <Modal title="Tambah User Baru" onClose={() => setShowAddModal(false)}>
          <UserForm
            form={form}
            editMode={false}
            submitting={submitting}
            submitLabel="Tambah User"
            onChange={setForm}
            onSubmit={handleSubmitAdd}
          />
        </Modal>
      ) : null}

      {editUser ? (
        <Modal title={`Edit ${editUser.name}`} onClose={() => setEditUser(null)}>
          <UserForm
            form={form}
            editMode
            submitting={submitting}
            submitLabel="Simpan Perubahan"
            onChange={setForm}
            onSubmit={handleSubmitEdit}
          />
        </Modal>
      ) : null}

      {deleteUser ? (
        <Modal title="Konfirmasi Hapus" onClose={() => setDeleteUser(null)}>
          <div className="space-y-md text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-100 text-red-700">
              <MaterialIcon filled className="text-3xl">
                delete
              </MaterialIcon>
            </div>
            <div>
              <p className="font-extrabold text-on-surface">Hapus {deleteUser.name}?</p>
              <p className="mt-xs text-sm text-on-surface-variant">Aksi ini tidak dapat dibatalkan dari halaman ini.</p>
            </div>
            <div className="grid gap-sm sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="min-h-11 rounded-xl border border-outline-variant/25 px-md text-sm font-extrabold text-on-surface-variant transition hover:bg-surface-container"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="min-h-11 rounded-xl bg-red-600 px-md text-sm font-extrabold text-white transition hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
