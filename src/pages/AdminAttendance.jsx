import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import toast from "react-hot-toast";
import api from "../api/api.js";
import * as XLSX from "xlsx";
import {
  HiOutlineUserAdd,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineTicket,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDownload,
  HiChevronLeft,
  HiChevronRight,
  HiLightningBolt // Icon untuk konsumsi
} from "react-icons/hi";

export default function AdminAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Pagination & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [eventName, setEventName] = useState("Loading...");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10; 

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (eventName === "Loading...") {
        const resEvent = await api.get(`/api/events/${id}`);
        setEventName(resEvent.data.nama_event);
      }

      const resAtt = await api.get(`/api/attendance/${id}`, {
        params: {
          page: page,
          limit: limit,
          search: searchTerm
        }
      });

      setAttendances(resAtt.data.data || []);
      
      if (resAtt.data.pagination) {
        setTotalPages(resAtt.data.pagination.totalPages);
        setTotalItems(resAtt.data.pagination.totalItems);
      } else {
        console.warn("Backend tidak mengirim data pagination.");
      }

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data peserta");
      if (err.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [id, page, searchTerm, navigate, eventName]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleDelete = async (attendanceId) => {
    if (!window.confirm("Hapus peserta ini? Tiket mereka akan menjadi TIDAK VALID.")) return;

    try {
      await api.delete(`/api/attendance/item/${attendanceId}`);
      toast.success("Peserta dihapus");
      fetchData(); 
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus data");
    }
  };

  // --- EXPORT EXCEL UPDATE ---
  const exportToExcel = async () => {
    const loadId = toast.loading("Mempersiapkan Excel...");
    try {
      const res = await api.get(`/api/attendance/${id}`, {
        params: { page: 1, limit: 10000, search: searchTerm } 
      });
      
      const allData = res.data.data || [];

      if (allData.length === 0) {
        toast.dismiss(loadId);
        return toast.error("Tidak ada data untuk diexport");
      }

      const dataToExport = allData.map((item, index) => ({
        No: index + 1,
        Nama: item.nama,
        Token: item.ticket_token,
        "No HP": item.no_hp,
        Alamat: item.alamat || "-",
        "Status Kehadiran": Number(item.status_hadir) === 1 ? "Hadir" : "Belum",
        "Waktu Masuk": Number(item.status_hadir) === 1 
          ? new Date(item.jam_masuk).toLocaleString("id-ID") 
          : "-",
        // FIELD BARU DI EXCEL
        "Status Konsumsi": Number(item.status_konsumsi) === 1 ? "Sudah Diambil" : "Belum",
        "Waktu Ambil Konsumsi": Number(item.status_konsumsi) === 1 
          ? new Date(item.jam_ambil_konsumsi).toLocaleString("id-ID")
          : "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kehadiran");

      XLSX.writeFile(workbook, `Absensi_${eventName.substring(0, 20)}.xlsx`);
      toast.dismiss(loadId);
      toast.success("Data berhasil diexport!");
    } catch (e) {
      console.error(e);
      toast.dismiss(loadId);
      toast.error("Gagal export excel");
    }
  };

  const renderPagination = () => {
    if (totalItems === 0) return null;

    const pages = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/30 gap-4">
        <p className="text-xs text-zinc-500 font-medium">
          Menampilkan {attendances.length} dari <strong>{totalItems}</strong> data
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <HiChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1">
            {startPage > 1 && <span className="text-xs text-zinc-400 px-1">...</span>}
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  page === p
                    ? "bg-zinc-900 text-white shadow-md"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                }`}
              >
                {p}
              </button>
            ))}
            {endPage < totalPages && <span className="text-xs text-zinc-400 px-1">...</span>}
          </div>

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <HiChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');`}
      </style>

      <div className="min-h-screen bg-[#FAF9F5] flex text-zinc-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <Sidebar />

        <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 overflow-x-hidden">
          
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                    Management
                 </span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
                Daftar Peserta
              </h1>
              <p className="text-sm text-zinc-500 font-medium mt-1">
                Event: <span className="font-bold text-zinc-900">{eventName}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
               <Link
                  to={`/admin/events/${id}/details`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <HiOutlineArrowLeft size={16} /> Detail Event
                </Link>
                <Link
                  to={`/admin/events/${id}/add-attendance`}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-lg"
                >
                  <HiOutlineUserAdd size={16} /> Tambah Manual
                </Link>
            </div>
          </header>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            
            <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-3 bg-zinc-50/50 justify-between items-center">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-zinc-200 w-full sm:w-auto flex-1 max-w-md focus-within:border-zinc-400 transition-colors">
                <HiOutlineSearch className="text-zinc-400" size={20} />
                <input 
                  type="text"
                  placeholder="Cari nama, no hp, atau token..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full text-sm font-medium outline-none placeholder:text-zinc-400 bg-transparent"
                />
              </div>

              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-green-700 transition-all shadow-sm w-full sm:w-auto justify-center"
              >
                <HiOutlineDownload size={16} /> Export Excel
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 animate-pulse">
                  <div className="h-8 w-8 bg-zinc-200 rounded-full mb-3"></div>
                  <span className="text-sm font-medium">Memuat data...</span>
                </div>
              ) : attendances.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
                  <span className="text-sm font-medium italic">Tidak ada data peserta ditemukan.</span>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-[10px] align-middle">
                        Peserta & Token
                      </th>
                      <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-[10px] align-middle">
                        Alamat / Kontak
                      </th>
                      <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-[10px] align-middle">
                        Kehadiran
                      </th>
                      {/* KOLOM BARU: KONSUMSI */}
                      <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-[10px] align-middle">
                        Konsumsi
                      </th>
                      <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-[10px] text-right align-middle">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {attendances.map((item) => (
                      <tr key={item.attendance_id} className="hover:bg-zinc-50/50 transition-colors group">
                        
                        {/* Kolom 1: Peserta */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-900">{item.nama}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <HiOutlineTicket size={12} className="text-purple-500" />
                            <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                              {item.ticket_token}
                            </span>
                          </div>
                        </td>

                        {/* Kolom 2: Alamat & Kontak */}
                        <td className="px-6 py-4">
                          <p className="text-xs text-zinc-600 leading-relaxed max-w-[200px] mb-1">
                            {item.alamat || "-"}
                          </p>
                          <span className="font-mono text-[10px] text-zinc-500 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                            {item.no_hp}
                          </span>
                        </td>

                        {/* Kolom 3: Status Kehadiran (Ada Jamnya) */}
                        <td className="px-6 py-4">
                          {Number(item.status_hadir) === 1 ? (
                            <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide border border-green-200">
                                  <HiOutlineCheckCircle size={12} /> Hadir
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono pl-1">
                                    {new Date(item.jam_masuk).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})} WIB
                                </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wide border border-zinc-200">
                              <HiOutlineXCircle size={12} /> Belum
                            </span>
                          )}
                        </td>

                        {/* Kolom 4: Status Konsumsi (BARU) */}
                        <td className="px-6 py-4">
                          {Number(item.status_konsumsi) === 1 ? (
                             <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wide border border-yellow-200">
                                  <HiLightningBolt size={12} /> Diambil
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono pl-1">
                                    {item.jam_ambil_konsumsi 
                                        ? new Date(item.jam_ambil_konsumsi).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'}) + " WIB"
                                        : "-"
                                    }
                                </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-400 text-[10px] font-bold uppercase tracking-wide border border-zinc-200 border-dashed">
                              Belum
                            </span>
                          )}
                        </td>

                        {/* Kolom 5: Aksi */}
                        <td className="px-6 py-4 text-right align-middle">
                          <button
                            onClick={() => handleDelete(item.attendance_id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Peserta"
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {renderPagination()}
          </div>

        </main>
      </div>
    </>
  );
}