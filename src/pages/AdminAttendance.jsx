import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api.js";
import Sidebar from "../components/Sidebar.jsx";
import * as XLSX from "xlsx"; // Import library XLSX

export default function AdminAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const evRes = await api.get(`/api/events/${id}`);
      setEvent(evRes.data);
      const attRes = await api.get(`/api/attendance/event/${id}`);
      setAttendance(attRes.data?.data || []);
      setTotal(attRes.data?.total_hadir || 0);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
      if (error?.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fungsi Export Excel
  const exportToExcel = () => {
    if (attendance.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    // Mapping data agar kolom di Excel lebih rapi
    const dataToExport = attendance.map((row, index) => ({
      No: index + 1,
      Nama: row.nama,
      "No HP": row.no_hp,
      Alamat: row.alamat || "-",
      "Waktu Masuk": new Date(row.jam_masuk).toLocaleString("id-ID"),
      Token: row.ticket_token,
    }));

    // Membuat worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    // Membuat workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kehadiran");

    // Mengunduh file (Nama file berdasarkan nama event)
    const fileName = `Kehadiran_${event?.nama_event || "Event"}_${id}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Excel berhasil diunduh");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex text-zinc-900">
      <Sidebar />

      <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 overflow-x-hidden">
        {/* Glossy Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white bg-white/40 p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-zinc-200/30 blur-3xl"></div>

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-2 py-1 rounded bg-zinc-200 text-zinc-700 text-[10px] font-bold tracking-wider">
                EVENT ID: {id}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                {loading ? "Loading..." : event?.nama_event}
              </h1>
              <p className="flex items-center gap-2 text-sm text-zinc-500 font-medium tracking-wide italic">
                <span
                  className={
                    event?.status_event === "aktif"
                      ? "text-green-600"
                      : "text-zinc-400"
                  }
                >
                  ●
                </span>
                {event?.status_event === "aktif"
                  ? "Sedang Berlangsung"
                  : "Event Selesai"}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end bg-white/50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none border border-white md:border-none shadow-sm md:shadow-none">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Total Hadir
              </span>
              <span className="text-4xl md:text-5xl font-black text-[#1A1A1A]">
                {total}
              </span>
            </div>
          </div>
        </div>

        {/* Content Table Container */}
        <div className="mt-8 md:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 px-1">
            <h2 className="text-lg font-bold text-zinc-800">
              Daftar Kehadiran
            </h2>
            <div className="flex gap-2">
              {/* Tombol Export Excel */}
              <button
                onClick={exportToExcel}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold uppercase shadow-md active:scale-95 transition-all hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {/* Kode Path yang sudah diperbaiki (Menghapus kata 'Status') */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Excel
              </button>

              <button
                onClick={fetchAll}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold uppercase shadow-sm active:scale-95 transition-all hover:bg-zinc-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200/60 bg-white shadow-sm overflow-hidden text-[#1A1A1A]">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center text-zinc-400 italic font-medium">
                  Memperbarui data...
                </div>
              ) : attendance.length === 0 ? (
                <div className="p-20 text-center text-zinc-400 font-medium">
                  Belum ada peserta check-in.
                </div>
              ) : (
                <table className="w-full text-left min-w-[600px] md:min-w-full">
                  <thead>
                    <tr className="bg-zinc-50/50 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                      <th className="px-6 py-4 border-b border-zinc-100">
                        Peserta
                      </th>
                      {/* Kolom Alamat Baru */}
                      <th className="px-6 py-4 border-b border-zinc-100">
                        Alamat
                      </th>
                      <th className="hidden sm:table-cell px-6 py-4 border-b border-zinc-100">
                        Kontak
                      </th>
                      <th className="px-6 py-4 border-b border-zinc-100">
                        Waktu Masuk
                      </th>
                      <th className="px-6 py-4 border-b border-zinc-100 text-right">
                        Token
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-sm">
                    {attendance.map((row) => (
                      <tr
                        key={row.attendance_id}
                        className="hover:bg-zinc-50/50 transition-colors group"
                      >
                        {/* Kolom Nama */}
                        <td className="px-6 py-4 font-bold text-zinc-800">
                          {row.nama}
                          {/* No HP tetap muncul di bawah nama hanya pada mobile */}
                          <div className="sm:hidden text-[10px] font-medium text-zinc-500 mt-0.5 font-normal">
                            {row.no_hp}
                          </div>
                        </td>

                        {/* Kolom Alamat Mandiri */}
                        <td className="px-6 py-4 text-zinc-500">
                          <div className="max-w-[200px] break-words leading-relaxed text-xs">
                            {row.alamat || "-"}
                          </div>
                        </td>

                        {/* Kolom Kontak (Desktop) */}
                        <td className="hidden sm:table-cell px-6 py-4 text-zinc-600 font-medium">
                          {row.no_hp}
                        </td>

                        {/* Kolom Waktu */}
                        <td className="px-6 py-4 text-zinc-500 text-xs md:text-sm">
                          {new Date(row.jam_masuk).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Kolom Token */}
                        <td className="px-6 py-4 text-right">
                          <span className="inline-block px-2 md:px-3 py-1 rounded-lg bg-zinc-100 font-mono text-[10px] md:text-xs font-bold text-zinc-600 border border-zinc-200 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
                            {row.ticket_token}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
