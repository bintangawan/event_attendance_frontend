import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api.js";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/admin/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      toast.success("Selamat datang kembali, Admin!");
      navigate("/admin/events");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Login gagal, cek kembali kredensial Anda"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 flex items-center justify-center px-4">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="relative w-full max-w-[400px]">
        {/* Header Area */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Portal Admin
          </h1>
          <p className="mt-2 text-sm text-zinc-400 font-light">
            Silahkan masuk untuk mengelola sistem
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={onChange}
                className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none ring-1 ring-transparent transition-all focus:border-indigo-500 focus:ring-indigo-500/20"
                placeholder="admin@event.com"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={onChange}
                className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none ring-1 ring-transparent transition-all focus:border-indigo-500 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Masuk Ke Dashboard"
              )}
            </button>
          </form>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-600">
          &copy; 2026 Event Attendance System
        </p>
      </div>
    </div>
  );
}
