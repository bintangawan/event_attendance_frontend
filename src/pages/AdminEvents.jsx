import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import toast from "react-hot-toast";
import api from "../api/api.js";

// Helper functions
function formatLocalDatetimeValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toMysqlDatetime(dtLocal) {
  if (!dtLocal) return null;
  return dtLocal.replace("T", " ") + ":00";
}

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  // STATE UNTUK PAGINATION
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [form, setForm] = useState(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    return {
      nama_event: "",
      tanggal_event: now.toISOString().slice(0, 10),
      jam_masuk_mulai: "08:00",
      jam_masuk_selesai: "10:00",
      checkin_end_time_local: formatLocalDatetimeValue(end),
    };
  });

  // MODIFIKASI: Fetch data dengan parameter page
  const fetchEvents = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        // Memanggil endpoint dengan query limit=5
        const res = await api.get(`/api/events?page=${page}&limit=5`);

        // Sesuaikan dengan struktur respons backend { data: [], pagination: {} }
        setEvents(res.data.data || []);
        setPagination({
          currentPage: res.data.pagination.currentPage,
          totalPages: res.data.pagination.totalPages,
          totalItems: res.data.pagination.totalItems,
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || "Gagal mengambil event");
        if (err?.response?.status === 401) navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEvents(newPage);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!form.nama_event) return toast.error("Nama event wajib diisi.");

    const payload = {
      nama_event: form.nama_event.trim(),
      tanggal_event: form.tanggal_event,
      jam_masuk_mulai: form.jam_masuk_mulai,
      jam_masuk_selesai: form.jam_masuk_selesai,
      checkin_end_time: toMysqlDatetime(form.checkin_end_time_local),
    };

    try {
      setCreating(true);
      const res = await api.post("/api/events", payload);
      toast.success("Event berhasil dibuat");
      setSelected(res.data.event);
      setForm((p) => ({ ...p, nama_event: "" }));
      await fetchEvents(1); // Kembali ke halaman 1 untuk melihat event terbaru
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal membuat event");
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (eventId) => {
    try {
      const res = await api.get(`/api/events/${eventId}`);
      setSelected(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Gagal ambil detail event");
    }
  };

  const setStatus = async (eventId, status_event) => {
    try {
      await api.patch(`/api/events/${eventId}/status`, { status_event });
      toast.success(`Status diubah ke ${status_event}`);
      await fetchEvents(pagination.currentPage); // Tetap di halaman saat ini
      if (selected?.event_id === eventId) {
        setSelected((prev) => (prev ? { ...prev, status_event } : null));
      }
    } catch {
      toast.error("Gagal ubah status");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex text-zinc-900">
      <Sidebar />

      <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 overflow-x-hidden">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Manage Events
          </h1>
          <p className="text-zinc-500 font-medium text-sm md:text-base">
            Buat dan atur akses check-in event Anda.
          </p>
        </header>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-8">
            <form
              onSubmit={createEvent}
              className="rounded-3xl border border-white bg-white/60 p-5 md:p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-sm"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1A1A1A]"></span>
                Buat Event Baru
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest ml-1">
                    Nama Event
                  </label>
                  <input
                    name="nama_event"
                    value={form.nama_event}
                    onChange={onChange}
                    className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-[#1A1A1A] transition-all shadow-sm"
                    placeholder="Contoh: Seminar Teknologi 2026"
                  />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest ml-1">
                      Tanggal Event
                    </label>
                    <input
                      type="date"
                      name="tanggal_event"
                      value={form.tanggal_event}
                      onChange={onChange}
                      className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-[#1A1A1A] transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest ml-1">
                      Check-in Selesai
                    </label>
                    <input
                      type="datetime-local"
                      name="checkin_end_time_local"
                      value={form.checkin_end_time_local}
                      onChange={onChange}
                      className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-[#1A1A1A] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest ml-1">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      name="jam_masuk_mulai"
                      value={form.jam_masuk_mulai}
                      onChange={onChange}
                      className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-[#1A1A1A] transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest ml-1">
                      Jam Berakhir
                    </label>
                    <input
                      type="time"
                      name="jam_masuk_selesai"
                      value={form.jam_masuk_selesai}
                      onChange={onChange}
                      className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-[#1A1A1A] transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={creating}
                className="mt-8 w-full rounded-2xl bg-[#1A1A1A] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-zinc-300 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {creating ? "Memproses..." : "BUAT EVENT & GENERATE QR"}
              </button>
            </form>

            <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <h2 className="font-bold text-zinc-800 text-sm md:text-base">
                  Daftar Event Tersedia
                </h2>
                <button
                  onClick={() => fetchEvents(pagination.currentPage)}
                  className="text-[10px] md:text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest"
                >
                  Refresh List
                </button>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-10 md:p-20 text-center text-zinc-400 font-medium italic">
                    Menghubungkan ke server...
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-10 md:p-20 text-center text-zinc-400 font-medium">
                    Belum ada event yang dibuat.
                  </div>
                ) : (
                  <>
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead>
                        <tr className="text-zinc-400 border-b border-zinc-100">
                          <th className="px-4 md:px-6 py-4 font-bold uppercase tracking-tighter text-[10px]">
                            Event
                          </th>
                          <th className="hidden sm:table-cell px-4 md:px-6 py-4 font-bold uppercase tracking-tighter text-[10px]">
                            Code
                          </th>
                          <th className="px-4 md:px-6 py-4 font-bold uppercase tracking-tighter text-[10px]">
                            Status
                          </th>
                          <th className="px-4 md:px-6 py-4 font-bold uppercase tracking-tighter text-[10px] text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {events.map((ev) => (
                          <tr
                            key={ev.event_id}
                            className="hover:bg-zinc-50/50 transition-colors"
                          >
                            <td className="px-4 md:px-6 py-4">
                              <div className="font-bold text-zinc-800 text-xs md:text-sm">
                                {ev.nama_event}
                              </div>
                              <div className="sm:hidden text-[9px] font-mono text-zinc-500 font-bold">
                                {ev.event_code}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-medium italic">
                                {String(ev.tanggal_event).slice(0, 10)}
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-4 md:px-6 py-4 font-mono text-zinc-500 font-bold text-xs">
                              {ev.event_code}
                            </td>
                            <td className="px-4 md:px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                                  ev.status_event === "aktif"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-zinc-100 text-zinc-500"
                                }`}
                              >
                                {ev.status_event}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5 md:gap-2">
                                <button
                                  onClick={() => openDetail(ev.event_id)}
                                  className="h-7 w-7 md:h-8 md:w-8 rounded-lg border border-zinc-200 grid place-items-center hover:bg-zinc-900 hover:text-white transition-all shadow-sm"
                                >
                                  <span className="text-[9px] font-bold">
                                    QR
                                  </span>
                                </button>
                                <Link
                                  to={`/admin/events/${ev.event_id}/attendance`}
                                  className="px-2 md:px-3 py-1.5 rounded-lg bg-zinc-100 text-[9px] font-bold uppercase hover:bg-zinc-200 transition-colors inline-block"
                                >
                                  Details
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* PAGINATION UI */}
                    <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <span className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest">
                        Page {pagination.currentPage} of {pagination.totalPages}{" "}
                        ({pagination.totalItems} Events)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={pagination.currentPage === 1}
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                          className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-[10px] font-bold uppercase disabled:opacity-30 hover:bg-zinc-100 transition-all shadow-sm"
                        >
                          Prev
                        </button>
                        <button
                          disabled={
                            pagination.currentPage === pagination.totalPages
                          }
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                          className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-[10px] font-bold uppercase disabled:opacity-30 hover:bg-zinc-100 transition-all shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-8">
            <div
              className={`rounded-3xl border border-white bg-white/40 p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all duration-500 ${
                !selected ? "opacity-50 grayscale" : "opacity-100"
              }`}
            >
              <h2 className="text-lg md:text-xl font-bold mb-4 tracking-tight">
                Public Access QR
              </h2>

              {!selected ? (
                <div className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 grid place-items-center text-center p-6 md:p-8">
                  <p className="text-zinc-400 text-xs md:text-sm font-medium">
                    Pilih event dari daftar untuk menampilkan QR Code akses
                    publik.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 md:space-y-6">
                  <div className="p-3 md:p-4 rounded-2xl bg-white shadow-inner border border-zinc-100">
                    <img
                      src={selected.qr_image}
                      alt="QR"
                      className="w-full h-auto rounded-lg mx-auto max-w-[250px] lg:max-w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Target Link
                    </p>
                    <div className="p-3 rounded-xl bg-zinc-100/50 border border-zinc-200 text-[10px] md:text-xs font-mono break-all text-zinc-600">
                      {selected.qr_checkin_url}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStatus(selected.event_id, "aktif")}
                      className="py-2 md:py-3 rounded-xl border border-zinc-200 bg-white text-[10px] md:text-xs font-bold uppercase hover:bg-green-50 hover:text-green-600 transition-all"
                    >
                      Aktifkan
                    </button>
                    <button
                      onClick={() => setStatus(selected.event_id, "selesai")}
                      className="py-2 md:py-3 rounded-xl border border-zinc-200 bg-white text-[10px] md:text-xs font-bold uppercase hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Selesai
                    </button>
                  </div>

                  <Link
                    to={`/admin/events/${selected.event_id}/attendance`}
                    className="flex items-center justify-center gap-2 w-full py-3 md:py-4 rounded-2xl bg-[#1A1A1A] text-white text-xs md:text-sm font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Pantau Kehadiran →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
