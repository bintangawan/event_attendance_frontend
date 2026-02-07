import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineArrowRight,
  HiOutlineStatusOnline,
  HiOutlineArchive,
  HiSearch,
  HiFilter,
} from "react-icons/hi";

export default function LandingPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/api/eventdetails/public/events");
        setAllEvents(res.data.data || []);
      } catch (err) {
        console.error("Gagal memuat event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // --- LOGIC FILTERING ---
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (filterStatus !== "all" && ev.status_event !== filterStatus)
        return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = ev.nama_event.toLowerCase().includes(term);
        const matchCode = ev.event_code.toLowerCase().includes(term);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [allEvents, filterStatus, searchTerm]);

  const activeEvents = filteredEvents.filter(
    (ev) => ev.status_event === "aktif",
  );
  const pastEvents = filteredEvents.filter(
    (ev) => ev.status_event === "selesai",
  );

  // --- FORMATTER TANGGAL RENTANG (DENGAN LOGIKA VALID) ---
  const formatEventDateRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return "-";

    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : startDate;

    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    const startFmt = startDate.toLocaleDateString("id-ID", options);

    // Cek apakah hari, bulan, dan tahun sama persis
    const isSameDay =
      startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    if (isSameDay) {
      return startFmt;
    } else {
      const endFmt = endDate.toLocaleDateString("id-ID", options);
      return `${startFmt} - ${endFmt}`;
    }
  };

  const EventCard = ({ event, isActive }) => (
    <div className="group relative flex flex-col h-full overflow-hidden rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:bg-white/15 hover:border-white/30">
      {/* Gradient Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-500"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Top Gradient Bar */}
      <div
        className={`absolute top-0 left-0 h-1 w-full ${
          isActive
            ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
            : "bg-gradient-to-r from-gray-400 to-gray-500"
        }`}
      ></div>

      <div className="p-7 md:p-8 flex flex-col h-full relative z-10">
        {/* Header Card */}
        <div className="flex justify-between items-start mb-5">
          <span
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm ${
              isActive
                ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 shadow-lg shadow-emerald-500/20"
                : "bg-gray-500/20 text-gray-200 border border-gray-400/30"
            }`}
          >
            {isActive ? "LIVE NOW" : "SELESAI"}
          </span>
          {isActive ? (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-lg shadow-emerald-500/50"></span>
            </span>
          ) : (
            <HiOutlineArchive className="text-gray-300" size={22} />
          )}
        </div>

        {/* Title & Code */}
        <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-3 line-clamp-2 min-h-[3.5rem] drop-shadow-lg">
          {event.nama_event}
        </h3>
        <p className="text-xs font-mono text-blue-200 bg-white/10 backdrop-blur-sm w-fit px-3 py-1.5 rounded-lg border border-white/20 mb-6 shadow-md">
          {event.event_code}
        </p>

        {/* Info Grid */}
        <div className="space-y-3 mb-8 flex-grow">
          {/* Tanggal (Bisa Rentang) */}
          <div className="flex items-start gap-3 text-white text-sm bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg">
            <div className="p-2 bg-blue-400/30 text-blue-100 rounded-lg shrink-0 backdrop-blur-sm border border-blue-300/20">
              <HiOutlineCalendar size={16} />
            </div>
            <span className="font-semibold leading-snug pt-0.5">
              {formatEventDateRange(
                event.tanggal_event,
                event.checkin_end_time,
              )}
            </span>
          </div>

          {/* Jam */}
          <div className="flex items-center gap-3 text-white text-sm bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg">
            <div className="p-2 bg-orange-400/30 text-orange-100 rounded-lg shrink-0 backdrop-blur-sm border border-orange-300/20">
              <HiOutlineClock size={16} />
            </div>
            <span className="font-semibold">
              {event.jam_masuk_mulai.slice(0, 5)} -{" "}
              {event.jam_masuk_selesai.slice(0, 5)} WIB
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/event/${event.event_code}`}
          className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all mt-auto backdrop-blur-sm ${
            isActive
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] border border-white/20"
              : "bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-lg"
          }`}
        >
          {isActive ? "Lihat Event" : "Lihat History"}
          <HiOutlineArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Inject Font Poppins secara Global */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        body { 
          font-family: 'Poppins', sans-serif;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="min-h-screen bg-[#111] text-white pb-20 overflow-x-hidden relative">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[110px]"></div>
        </div>

        {/* HERO HEADER */}
        <div className="pt-24 pb-32 relative z-10">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-4 leading-tight">
              <span className="text-white drop-shadow-2xl">EVENT</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-2xl">
                SYSTEM
              </span>{" "}
              <span className="text-white drop-shadow-2xl">ATTENDANCES</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg">
              Portal absensi digital dan dokumentasi kegiatan resmi. Temukan
              event Anda di bawah ini.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER BAR (Floating Glass) */}
        <div className="container mx-auto px-4 md:px-8 -mt-8 relative z-30">
          <div className="backdrop-blur-2xl bg-white/15 border border-white/30 p-2 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto mb-12">
            {/* Search Input */}
            <div className="relative flex-1">
              <HiSearch
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari nama event atau kode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-transparent outline-none text-white font-bold placeholder:text-white/50 h-full rounded-[1.5rem] focus:bg-white/10 transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative md:w-48 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <HiFilter className="text-white/60 group-hover:text-white/80 transition-colors" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-full pl-10 pr-8 py-4 bg-white/10 backdrop-blur-sm rounded-[1.5rem] text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer border-l border-white/20 hover:bg-white/15 transition-all"
              >
                <option value="all" className="bg-purple-600 text-white">Semua Status</option>
                <option value="aktif" className="bg-purple-600 text-white">Sedang Aktif</option>
                <option value="selesai" className="bg-purple-600 text-white">Selesai</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/60">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="container mx-auto px-6 relative z-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-white/80 font-bold text-sm tracking-widest uppercase drop-shadow-lg">
                Memuat Event...
              </p>
            </div>
          ) : (
            <>
              {/* === SECTION: ACTIVE EVENTS === */}
              {activeEvents.length > 0 && (
                <div className="mb-16 animate-in slide-in-from-bottom-10 duration-700">
                  <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl shadow-xl backdrop-blur-md border border-emerald-400/30">
                      <HiOutlineStatusOnline size={26} />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                        Sedang Berlangsung
                      </h2>
                      <p className="text-white/60 text-sm font-medium">
                        Event yang sedang aktif saat ini
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeEvents.map((ev) => (
                      <EventCard key={ev.event_id} event={ev} isActive={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* === SECTION: PAST EVENTS === */}
              {pastEvents.length > 0 && (
                <div className="animate-in slide-in-from-bottom-10 duration-700 delay-200">
                  <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="p-3 bg-zinc-500/20 text-zinc-300 rounded-xl shadow-xl backdrop-blur-md border border-zinc-400/30">
                      <HiOutlineArchive size={26} />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                        Riwayat Event
                      </h2>
                      <p className="text-white/60 text-sm font-medium">
                        Arsip event yang telah selesai
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastEvents.map((ev) => (
                      <EventCard
                        key={ev.event_id}
                        event={ev}
                        isActive={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* === EMPTY STATE === */}
              {activeEvents.length === 0 && pastEvents.length === 0 && (
                <div className="text-center py-24 bg-white/10 backdrop-blur-xl rounded-3xl border border-dashed border-white/30 mx-auto max-w-2xl shadow-2xl">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <HiSearch size={36} className="text-white/60" />
                  </div>
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                    Tidak Ada Event Ditemukan
                  </h3>
                  <p className="text-white/70 font-medium text-sm mt-2">
                    Coba ubah kata kunci pencarian atau filter Anda.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-16 max-w-md mx-auto text-center border-t border-white/20 pt-6 pb-2 relative z-20">
          <p className="text-sm font-medium text-white/60 tracking-wide">
            © {new Date().getFullYear()} bintangin.com · Event System Attendance
          </p>
        </div>
      </div>
    </>
  );
}