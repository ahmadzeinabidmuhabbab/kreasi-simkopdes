import { NextResponse } from "next/server";

// ── In-memory user store (shared with auth) ────────────────────────────────
let users = [
  { id: 1, name: "Admin Kopdes", username: "admin", password: "admin123", role: "Super Admin", email: "admin@kreasi.id", active: true, createdAt: "2026-01-01" },
  { id: 2, name: "Budi Operator", username: "op1",   password: "op1pass",  role: "Operator",   email: "budi@kreasi.id",  active: true, createdAt: "2026-02-15" },
  { id: 3, name: "Ketua RW 03",  username: "rw",    password: "rwpass",   role: "Viewer",     email: "rw03@kreasi.id",  active: true, createdAt: "2026-03-10" },
];
let nextId = 4;

export async function GET() {
  return NextResponse.json({
    success: true,
    users: users.map(({ password: _pw, ...u }) => u), // omit password
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password, role, email } = body;

    if (!name || !username || !password || !role) {
      return NextResponse.json({ success: false, message: "Field wajib tidak lengkap" }, { status: 400 });
    }
    if (users.find(u => u.username === username)) {
      return NextResponse.json({ success: false, message: "Username sudah digunakan" }, { status: 409 });
    }

    const newUser = { id: nextId++, name, username, password, role, email: email || "", active: true, createdAt: new Date().toISOString().split("T")[0] };
    users.push(newUser);

    return NextResponse.json({ success: true, message: "User berhasil ditambahkan", user: { ...newUser, password: undefined } });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, username, password, role, email, active } = body;

    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: "User tidak ditemukan" }, { status: 404 });

    // Check duplicate username (excluding self)
    if (username && users.find(u => u.username === username && u.id !== id)) {
      return NextResponse.json({ success: false, message: "Username sudah digunakan" }, { status: 409 });
    }

    users[idx] = {
      ...users[idx],
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
      ...(password !== undefined && password !== "" && { password }),
      ...(role !== undefined && { role }),
      ...(email !== undefined && { email }),
      ...(active !== undefined && { active }),
    };

    return NextResponse.json({ success: true, message: "User berhasil diperbarui", user: { ...users[idx], password: undefined } });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (id === 1) return NextResponse.json({ success: false, message: "Admin utama tidak dapat dihapus" }, { status: 403 });

    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: "User tidak ditemukan" }, { status: 404 });

    const deleted = users[idx];
    users = users.filter(u => u.id !== id);

    return NextResponse.json({ success: true, message: `User ${deleted.name} berhasil dihapus` });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
