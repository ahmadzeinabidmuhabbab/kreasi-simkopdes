import { NextResponse } from "next/server";

// ── In-memory user store ──────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "Admin Kopdes", username: "admin", password: "admin123", role: "Super Admin", email: "admin@kreasi.id", active: true },
  { id: 2, name: "Budi Operator", username: "op1",   password: "op1pass",  role: "Operator",   email: "budi@kreasi.id",  active: true },
  { id: 3, name: "Ketua RW 03",  username: "rw",    password: "rwpass",   role: "Viewer",     email: "rw03@kreasi.id",  active: true },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const user = USERS.find(u => u.username === username && u.password === password && u.active);
    if (!user) {
      return NextResponse.json({ success: false, message: "Username atau password salah" }, { status: 401 });
    }

    // Return user info (no sensitive fields)
    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: { id: user.id, name: user.name, username: user.username, role: user.role, email: user.email },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
