import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import toast from "react-hot-toast";
import api from "../api/api.js";
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineQrcode,
  HiOutlinePlus,
  HiOutlineCursorClick,
  HiOutlineDocumentText, // Icon baru untuk Detail
} from "react-icons/hi";

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

  // State Data
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null); // Event yang diklik

  // State Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Form State
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

  // --- FETCH DATA ---
  const fetchEvents = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 5,
          search: search,
          status: statusFilter !== "all" ? statusFilter : undefined,
        };

        const res = await api.get(`/api/events`, { params });

        setEvents(res.data.data || []);
        setPagination({
          currentPage: res.data.pagination.currentPage,
          totalPages: res.data.pagination.totalPages,
          totalItems: res.data.pagination.totalItems,
        });
      } catch (err) {
        toast.error("Gagal mengambil data event");
        if (err?.response?.status === 401) navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    },
    [navigate, search, statusFilter],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEvents(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [fetchEvents, search, statusFilter]);

  // --- HANDLERS ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEvents(newPage);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleCreateEvent = async (e) => {
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
      setSelected(res.data.event); // Otomatis select event baru
      setForm((p) => ({ ...p, nama_event: "" }));
      fetchEvents(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal membuat event");
    } finally {
      setCreating(false);
    }
  };

  const handleSetStatus = async (eventId, status_event) => {
    if (!window.confirm(`Ubah status menjadi ${status_event}?`)) return;
    try {
      await api.patch(`/api/events/${eventId}/status`, { status_event });
      toast.success(`Status diubah ke ${status_event}`);
      fetchEvents(pagination.currentPage);
      // Update selected data if match
      if (selected?.event_id === eventId) {
        setSelected((prev) => ({ ...prev, status_event }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal ubah status");
    }
  };

  const handleDelete = async (eventId) => {
    if (
      !window.confirm(
        "Hapus event ini? Semua data peserta dan galeri akan hilang permanen.",
      )
    )
      return;
    try {
      await api.delete(`/api/events/${eventId}`);
      toast.success("Event dihapus");
      if (selected?.event_id === eventId) setSelected(null);
      fetchEvents(1);
    } catch (err) {
      toast.error("Gagal menghapus event");
    }
  };

  // --- UPDATED: OPEN DETAIL (Fetch from API to get QR Image) ---
  const openDetail = async (ev) => {
    const loadId = toast.loading("Memuat QR Code...");
    try {
      // Kita fetch ulang detail event dari ID agar mendapatkan field qr_image yang digenerate backend
      const res = await api.get(`/api/events/${ev.event_id}`);
      setSelected(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.dismiss(loadId);
    } catch (err) {
      console.error(err);
      toast.dismiss(loadId);
      toast.error("Gagal memuat QR Code");
    }
  };

  // --- RENDER PAGINATION ---
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const pages = [];
    let start = Math.max(1, pagination.currentPage - 2);
    let end = Math.min(pagination.totalPages, pagination.currentPage + 2);

    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="p-2 rounded-lg border border-zinc-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed bg-white shadow-sm"
        >
          <HiChevronLeft />
        </button>
        {start > 1 && <span className="text-xs text-zinc-400">...</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
              pagination.currentPage === p
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
            }`}
          >
            {p}
          </button>
        ))}
        {end < pagination.totalPages && (
          <span className="text-xs text-zinc-400">...</span>
        )}
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="p-2 rounded-lg border border-zinc-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed bg-white shadow-sm"
        >
          <HiChevronRight />
        </button>
      </div>
    );
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');`}</style>

      <div
        className="min-h-screen bg-[#FAF9F5] flex text-zinc-900"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <Sidebar />

        <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 overflow-x-hidden">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 uppercase">
              Manage Events
            </h1>
            <p className="text-zinc-500 font-medium text-sm md:text-base">
              Buat, pantau, dan atur status event Anda di sini.
            </p>
          </header>

          {/* --- TOP SECTION: FORM & QR DETAIL (SIDE BY SIDE) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 items-stretch">
            {/* 1. FORM CREATE (KIRI - 7 Kolom) */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <form
                onSubmit={handleCreateEvent}
                className="rounded-[2rem] border border-white bg-white/60 p-6 md:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-sm h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="p-2 bg-zinc-900 rounded-lg text-white">
                      <HiOutlinePlus size={16} />
                    </span>
                    Buat Event Baru
                  </h2>
                </div>

                <div className="space-y-5 flex-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1 mb-1 block">
                      Nama Event
                    </label>
                    <input
                      name="nama_event"
                      value={form.nama_event}
                      onChange={handleFormChange}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 outline-none focus:border-zinc-900 transition-all font-medium text-sm shadow-sm"
                      placeholder="Contoh: Seminar Teknologi 2026"
                    />
                  </div>

                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1 mb-1 block">
                        Tanggal Event
                      </label>
                      <input
                        type="date"
                        name="tanggal_event"
                        value={form.tanggal_event}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 outline-none focus:border-zinc-900 transition-all text-sm shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1 mb-1 block">
                        Check-in Ditutup
                      </label>
                      <input
                        type="datetime-local"
                        name="checkin_end_time_local"
                        value={form.checkin_end_time_local}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 outline-none focus:border-zinc-900 transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1 mb-1 block">
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        name="jam_masuk_mulai"
                        value={form.jam_masuk_mulai}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 outline-none focus:border-zinc-900 transition-all text-sm shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1 mb-1 block">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        name="jam_masuk_selesai"
                        value={form.jam_masuk_selesai}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 outline-none focus:border-zinc-900 transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={creating}
                  className="mt-8 w-full rounded-2xl bg-zinc-900 px-6 py-4 text-sm font-bold text-white shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  {creating ? "Memproses..." : "Simpan & Generate QR"}
                </button>
              </form>
            </div>

            {/* 2. QR DETAIL CARD / PLACEHOLDER (KANAN - 5 Kolom) */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="rounded-[2rem] border border-white bg-white/40 p-6 md:p-8 shadow-2xl backdrop-blur-md h-full flex flex-col relative overflow-hidden transition-all duration-300">
                {/* KONDISI: Jika ada event terpilih */}
                {selected ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                        <HiOutlineQrcode className="text-zinc-500" /> Public QR
                        Access
                      </h2>
                      <button
                        onClick={() => setSelected(null)}
                        className="text-[10px] uppercase font-bold text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        Tutup
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-zinc-100 shadow-inner mb-6 relative group">
                      <div className="absolute inset-0 bg-grid-zinc-100 opacity-50"></div>
                      {selected.qr_image ? (
                        <img
                          src={selected.qr_image}
                          alt="QR"
                          className="w-48 h-48 object-contain z-10 drop-shadow-sm group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-zinc-300 italic text-xs">
                          Loading QR...
                        </div>
                      )}
                      <p className="mt-4 text-[10px] font-mono text-zinc-400 bg-zinc-50 px-3 py-1 rounded-lg break-all text-center z-10 border border-zinc-100">
                        {selected.qr_checkin_url}
                      </p>
                    </div>

                    <div className="space-y-4 mt-auto">
                      <div>
                        <p className="text-center font-bold text-zinc-900 text-xl leading-tight mb-1">
                          {selected.nama_event}
                        </p>
                        <div className="flex justify-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selected.status_event === "aktif" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}
                          >
                            {selected.status_event}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase font-mono">
                            {selected.event_code}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {selected.status_event === "aktif" ? (
                          <button
                            onClick={() =>
                              handleSetStatus(selected.event_id, "selesai")
                            }
                            className="py-2.5 rounded-xl border border-red-200 bg-white text-red-500 text-xs font-bold uppercase hover:bg-red-50 transition-all"
                          >
                            Selesai
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleSetStatus(selected.event_id, "aktif")
                            }
                            className="py-2.5 rounded-xl border border-green-200 bg-white text-green-600 text-xs font-bold uppercase hover:bg-green-50 transition-all"
                          >
                            Aktifkan
                          </button>
                        )}

                        <Link
                          to={`/admin/events/${selected.event_id}/attendance`}
                          className="col-span-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <HiOutlineEye size={16} /> Pantau Kehadiran
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* KONDISI: Placeholder (Belum pilih) */
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                      <HiOutlineCursorClick
                        size={32}
                        className="text-zinc-400"
                      />
                    </div>
                    <h3 className="text-zinc-500 font-bold text-lg">
                      Belum Ada Event Dipilih
                    </h3>
                    <p className="text-zinc-400 text-xs max-w-[200px] mt-2 leading-relaxed">
                      Klik tombol{" "}
                      <span className="inline-block p-1 bg-zinc-200 rounded border border-zinc-300">
                        <HiOutlineQrcode className="inline" />
                      </span>{" "}
                      pada tabel di bawah untuk melihat QR Code & Detail.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- BOTTOM SECTION: TABLE LIST (FULL WIDTH) --- */}
          <div className="rounded-[2.5rem] border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* TOOLBAR */}
            <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/30">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <HiOutlineSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={18}
                  />
                  <input
                    placeholder="Cari event..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 bg-white text-sm font-medium outline-none focus:border-zinc-400 transition-all shadow-sm"
                  />
                </div>

                <div className="relative">
                  <HiOutlineFilter
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={18}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-11 pr-8 py-3 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-600 outline-none focus:border-zinc-400 cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="aktif">Aktif</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>

              {renderPagination()}
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center text-zinc-400 font-medium italic animate-pulse">
                  Memuat data...
                </div>
              ) : events.length === 0 ? (
                <div className="p-20 text-center text-zinc-400 font-medium">
                  Tidak ada event ditemukan.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 uppercase tracking-widest text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Event Info</th>
                      <th className="px-6 py-4">Jadwal</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {events.map((ev) => (
                      <tr
                        key={ev.event_id}
                        className={`hover:bg-zinc-50/50 transition-colors ${selected?.event_id === ev.event_id ? "bg-blue-50/50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-800 text-sm">
                            {ev.nama_event}
                          </div>
                          <div className="font-mono text-xs text-zinc-400 mt-1">
                            {ev.event_code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-zinc-600 font-medium text-xs">
                            {new Date(ev.tanggal_event).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {ev.jam_masuk_mulai.slice(0, 5)} -{" "}
                            {ev.jam_masuk_selesai.slice(0, 5)} WIB
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                              ev.status_event === "aktif"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-zinc-100 text-zinc-500 border-zinc-200"
                            }`}
                          >
                            {ev.status_event}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* TOMBOL QR / PREVIEW */}
                            <button
                              onClick={() => openDetail(ev)}
                              className={`p-2 rounded-lg border transition-all shadow-sm ${
                                selected?.event_id === ev.event_id
                                  ? "bg-zinc-900 text-white border-zinc-900"
                                  : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-900 hover:text-white"
                              }`}
                              title="Lihat QR"
                            >
                              <HiOutlineQrcode size={16} />
                            </button>

                            {/* TOMBOL DETAIL ATTENDANCE (BARU) */}
                            <Link
                              to={`/admin/events/${ev.event_id}/attendance`}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm text-xs font-semibold"
                              title="Detail Event & Absensi"
                            >
                              <HiOutlineDocumentText size={16} />
                              Details Event
                            </Link>

                            {/* TOMBOL STATUS */}
                            {ev.status_event === "aktif" ? (
                              <button
                                onClick={() =>
                                  handleSetStatus(ev.event_id, "selesai")
                                }
                                className="px-3 py-2 rounded-lg bg-white border border-red-200 text-red-500 text-[10px] font-bold uppercase hover:bg-red-50 transition-all"
                              >
                                Selesai
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleSetStatus(ev.event_id, "aktif")
                                }
                                className="px-3 py-2 rounded-lg bg-white border border-green-200 text-green-600 text-[10px] font-bold uppercase hover:bg-green-50 transition-all"
                              >
                                Aktifkan
                              </button>
                            )}

                            {/* TOMBOL DELETE */}
                            <button
                              onClick={() => handleDelete(ev.event_id)}
                              className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-100 hover:border-red-600"
                              title="Hapus Event"
                            >
                              <HiOutlineTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
