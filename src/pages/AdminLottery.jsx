import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api.js";
import Sidebar from "../components/Sidebar.jsx";
import * as XLSX from "xlsx";
import { RiFileExcel2Fill } from "react-icons/ri"; // Icon Excel

export default function AdminLottery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLotteryData = useCallback(async () => {
    try {
      setLoading(true);
      const evRes = await api.get(`/api/events/${id}`);
      setEvent(evRes.data);
      const histRes = await api.get(`/api/lottery/${id}/history`);
      setHistory(histRes.data?.data || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Gagal memuat data undian");
      if (error?.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchLotteryData();
  }, [fetchLotteryData]);

  const exportToExcel = () => {
    if (history.length === 0) {
      return toast.error("Tidak ada data untuk diexport");
    }

    const dataToExport = history.map((item, index) => ({
      No: index + 1,
      Nama: item.nama,
      Alamat: item.alamat || "-", // Menambahkan Alamat di Excel
      "Token Tiket": item.ticket_token,
      Hadiah: item.hadiah || "Lucky Winner",
      Tanggal: new Date(item.waktu_menang).toLocaleDateString("id-ID"),
      Jam: new Date(item.waktu_menang).toLocaleTimeString("id-ID"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pemenang");

    const fileName = `Pemenang_${event?.nama_event || "Event"}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Data berhasil diexport ke Excel");
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
          body, * {
            font-family: 'Poppins', sans-serif !important;
          }
        `}
      </style>
      <div className="min-h-screen bg-[#FAF9F5] flex text-zinc-900 font-sans">
        <Sidebar />
        <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 overflow-x-hidden">
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-3xl border border-white bg-white/40 p-6 md:p-8 shadow-xl backdrop-blur-md mb-8 transition-all">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-zinc-200/20 blur-2xl"></div>
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Lottery Management
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-zinc-900 uppercase tracking-tight mt-1">
                  {loading ? "Loading..." : event?.nama_event}
                </h1>
                <p className="text-zinc-500 font-medium italic text-sm">
                  Daftar pemenang undian yang telah dilakukan.
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-[#1A1A1A] text-white shadow-2xl flex items-center justify-center text-2xl">
                🏆
              </div>
            </div>
          </div>

          {/* History Pemenang Table */}
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-zinc-100 flex flex-wrap justify-between items-center bg-zinc-50/50 gap-4">
              <div>
                <h2 className="font-bold text-zinc-800">History Pemenang</h2>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                  Total: {history.length} Orang
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D6F42] text-white text-xs font-bold hover:bg-[#165a35] transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  <RiFileExcel2Fill size={18} />
                  Export Excel
                </button>

                <button
                  onClick={fetchLotteryData}
                  className="p-2.5 rounded-xl border border-zinc-200 bg-white text-sm hover:bg-zinc-50 transition-colors shadow-sm active:rotate-180 duration-500"
                  title="Refresh Data"
                >
                  🔄
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-zinc-50/30 text-[10px] font-black uppercase text-zinc-400 tracking-tighter">
                    <th className="px-8 py-5">Pemenang</th>
                    <th className="px-8 py-5">Alamat</th>
                    <th className="px-8 py-5">Hadiah</th>
                    <th className="px-8 py-5 text-right">Waktu Menang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 text-sm">
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-32 text-center text-zinc-400 italic"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl opacity-20">🎫</span>
                          <p>Belum ada data pemenang untuk event ini.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    history.map((w) => (
                      <tr
                        key={w.winner_id}
                        className="hover:bg-zinc-50/80 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="font-bold text-zinc-800 group-hover:text-black transition-colors">
                            {w.nama}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 bg-zinc-100 inline-block px-1.5 py-0.5 rounded mt-1 font-bold">
                            {w.ticket_token}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p
                            className="text-zinc-500 max-w-[200px] truncate text-xs"
                            title={w.alamat}
                          >
                            {w.alamat || "-"}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase border border-amber-100 shadow-sm">
                            {w.hadiah || "Lucky Winner"}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="text-zinc-800 font-medium">
                            {new Date(w.waktu_menang).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {new Date(w.waktu_menang).toLocaleTimeString(
                              "id-ID",
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
