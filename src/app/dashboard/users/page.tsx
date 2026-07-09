"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  email: string;
  active: boolean;
  createdAt: string;
}

const ROLES = ["Super Admin", "Operator", "Viewer"];
const roleColors: Record<string, string> = {
  "Super Admin": "bg-rose-100 text-rose-700",
  "Operator": "bg-sky-100 text-sky-700",
  "Viewer": "bg-amber-100 text-amber-700",
};

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-full max-w-md p-xl">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="text-lg font-extrabold text-on-surface">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Form fields helper ─────────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="space-y-xs">
      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-sm px-md py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "Operator", email: "" });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch {
      showToast("Gagal memuat data user", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openEdit = (u: User) => {
    setForm({ name: u.name, username: u.username, password: "", role: u.role, email: u.email });
    setEditUser(u);
  };

  const openAdd = () => {
    setForm({ name: "", username: "", password: "", role: "Operator", email: "" });
    setShowAddModal(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowAddModal(false);
        fetchUsers();
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    try {
      const payload = { id: editUser.id, ...form };
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setEditUser(null);
        fetchUsers();
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, active: !u.active }),
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); fetchUsers(); }
      else showToast(data.message, "error");
    } catch { showToast("Terjadi kesalahan", "error"); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteUser.id }),
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); setDeleteUser(null); fetchUsers(); }
      else showToast(data.message, "error");
    } catch { showToast("Terjadi kesalahan", "error"); }
  };

  const filtered = users.filter(u =>
    searchQuery === "" ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { sorted: sortedUsers, sortKey, sortDir, toggleSort } = useSortable(filtered, "name");

  const UserForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-md">
      <Field label="Nama Lengkap" icon="badge">
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap" required className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" />
      </Field>
      <Field label="Username" icon="person">
        <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username login" required className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" />
      </Field>
      <Field label={editUser ? "Password Baru (kosongkan jika tidak diubah)" : "Password"} icon="lock">
        <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? "Biarkan kosong jika tidak diubah" : "Password"} required={!editUser} className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" />
      </Field>
      <Field label="Email" icon="mail">
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@kreasi.id" className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" />
      </Field>
      <div className="space-y-xs">
        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Role</label>
        <div className="flex gap-xs flex-wrap">
          {ROLES.map(r => (
            <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
              className={`px-md py-2 rounded-xl text-xs font-bold transition-all border ${form.role === r ? "bg-primary text-white border-primary shadow-md shadow-primary/20" : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-sm py-3 bg-primary text-white rounded-xl font-extrabold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60">
        {submitting ? <><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>Menyimpan...</> : <><span className="material-symbols-outlined text-[18px]">save</span>{submitLabel}</>}
      </button>
    </form>
  );

  return (
    <div className="space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-sm px-md py-sm rounded-2xl shadow-2xl font-semibold text-sm border ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-violet-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Manajemen User</h1>
            <p className="text-sm text-on-surface-variant">Kelola akun dan hak akses pengguna KREASI Portal</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-sm px-lg py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Tambah User
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {[
          { label: "Total User", value: users.length, icon: "group", color: "bg-violet-100 text-violet-700" },
          { label: "Aktif", value: users.filter(u => u.active).length, icon: "check_circle", color: "bg-emerald-100 text-emerald-700" },
          { label: "Non-aktif", value: users.filter(u => !u.active).length, icon: "block", color: "bg-red-100 text-red-700" },
          { label: "Role", value: [...new Set(users.map(u => u.role))].length, icon: "shield", color: "bg-sky-100 text-sky-700" },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md transition-shadow flex items-center gap-md">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-extrabold text-on-surface">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-xs px-md py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl w-full sm:w-80">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
        <input type="text" placeholder="Cari nama, username, atau role..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-primary">close</button>}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/20">
                <th className="text-left px-md py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">#</th>
                <SortableHeader label="Nama"     colKey="name"      current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Username" colKey="username"  current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Role"     colKey="role"      current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Email"    colKey="email"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Status"   colKey="active"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Dibuat"   colKey="createdAt" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-md py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-2xl text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl animate-spin block mb-sm">sync</span>
                  Memuat data...
                </td></tr>
              ) : sortedUsers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-2xl text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl text-outline block mb-md">inbox</span>
                  Tidak ada user ditemukan
                </td></tr>
              ) : sortedUsers.map((u, i) => (
                <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-md py-3 text-on-surface-variant text-xs">{i + 1}</td>
                  <td className="px-md py-3">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-bold text-on-surface whitespace-nowrap">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-md py-3 font-mono text-xs text-on-surface-variant">@{u.username}</td>
                  <td className="px-md py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-md py-3 text-xs text-on-surface-variant">{u.email || "—"}</td>
                  <td className="px-md py-3">
                    <button onClick={() => handleToggleActive(u)} className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:opacity-80 ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {u.active ? "Aktif" : "Non-aktif"}
                    </button>
                  </td>
                  <td className="px-md py-3 text-xs text-on-surface-variant whitespace-nowrap">{u.createdAt}</td>
                  <td className="px-md py-3">
                    <div className="flex items-center gap-xs">
                      <button onClick={() => openEdit(u)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      {u.id !== 1 && (
                        <button onClick={() => setDeleteUser(u)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Hapus">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Tambah User Baru" onClose={() => setShowAddModal(false)}>
          <UserForm onSubmit={handleSubmitAdd} submitLabel="Tambah User" />
        </Modal>
      )}

      {/* Edit Modal */}
      {editUser && (
        <Modal title={`Edit User: ${editUser.name}`} onClose={() => setEditUser(null)}>
          <UserForm onSubmit={handleSubmitEdit} submitLabel="Simpan Perubahan" />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteUser && (
        <Modal title="Konfirmasi Hapus" onClose={() => setDeleteUser(null)}>
          <div className="text-center space-y-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Hapus <span className="text-red-600">{deleteUser.name}</span>?</p>
              <p className="text-sm text-on-surface-variant mt-xs">Aksi ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex gap-md">
              <button onClick={() => setDeleteUser(null)} className="flex-1 py-3 border border-outline-variant/30 rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                Ya, Hapus
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
