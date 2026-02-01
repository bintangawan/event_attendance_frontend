import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import toast from "react-hot-toast";
import api from "../api/api.js";
import {
  HiOutlineRefresh,
  HiOutlineCamera,
  HiOutlinePhotograph,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineInformationCircle,
  HiLightningBolt,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";

/**
 * Helper untuk mengambil Event Code dari URL QR
 */
function extractEventCodeFromQR(text) {
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("checkin");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    if (text.startsWith("EVT-")) return text.trim();
  }
  return null;
}

export default function ScanPage() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [activeEvent, setActiveEvent] = useState(null);

  const [landingData, setLandingData] = useState({
    description: "",
    gallery: [],
  });

  // State untuk Image Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- LOGIC (SAMA SEPERTI SEBELUMNYA) ---
  const initScanner = useCallback(
    async (mode) => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }

      try {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        const scanner = new QrScanner(
          videoEl,
          (result) => {
            const raw = result?.data || "";
            const eventCode = extractEventCodeFromQR(raw);
            if (!eventCode) {
              toast.error("QR tidak valid.");
              return;
            }
            scanner.stop();
            toast.success("QR Berhasil Terbaca");
            navigate(`/checkin/${eventCode}`);
          },
          {
            preferredCamera: mode,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
          }
        );

        scannerRef.current = scanner;
        await scanner.start();

        requestAnimationFrame(() => {
          setCameraReady(true);
        });
      } catch (err) {
        console.error("Scanner init error:", err);
      }
    },
    [navigate]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchEventDetails = async () => {
      try {
        const res = await api.get("/api/eventdetails");
        if (isMounted && res.data?.data) {
          const { event, description, gallery } = res.data.data;
          if (event) {
            setActiveEvent(event);
            document.title = `Check-in: ${event.nama_event}`;
          } else {
            document.title = "Absensi Kehadiran";
          }
          setLandingData({
            description: description || "-",
            gallery: gallery || [],
          });
        }
      } catch (err) {
        console.error("Gagal memuat detail event:", err);
      }
    };

    fetchEventDetails();
    initScanner(facingMode);

    return () => {
      isMounted = false;
      document.title = "Event Attendance";
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [facingMode, initScanner]);

  const toggleCamera = () => {
    setCameraReady(false);
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const formatEventDateRange = (startDate, endDate) => {
    if (!startDate) return "-";
    
    const start = new Date(startDate);
    // Jika checkin_end_time ada, pakai itu. Jika tidak, pakai start date.
    const end = endDate ? new Date(endDate) : start;
    
    const fmt = (d, opt) => d.toLocaleDateString("id-ID", opt);

    // 1. Jika Tanggal Sama Persis (Event 1 Hari)
    if (start.toDateString() === end.toDateString()) {
        return fmt(start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // 2. Jika Bulan & Tahun Sama (Contoh: 1 - 2 Februari 2026)
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()} - ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }

    // 3. Jika Beda Bulan (Contoh: 31 Januari - 2 Februari 2026)
    return `${fmt(start, { day: 'numeric', month: 'short' })} - ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "00:00";
    return timeString.substring(0, 5);
  };

  // --- HANDLER UNTUK UPLOAD QR IMAGE ---
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Memproses QR Code...", { id: "qr-upload" });
      
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      const eventCode = extractEventCodeFromQR(result.data);
      
      if (!eventCode) {
        toast.error("QR Code tidak valid", { id: "qr-upload" });
        return;
      }

      toast.success("QR Code berhasil terbaca!", { id: "qr-upload" });
      navigate(`/checkin/${eventCode}`);
    } catch (error) {
      console.error("Error scanning uploaded image:", error);
      toast.error("Gagal membaca QR Code dari gambar", { id: "qr-upload" });
    }

    // Reset input
    event.target.value = "";
  };

  // --- HANDLER UNTUK IMAGE VIEWER ---
  const openViewer = (index) => {
    setCurrentImageIndex(index);
    setViewerOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeViewer = () => {
    setViewerOpen(false);
    document.body.style.overflow = "auto";
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === landingData.gallery.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? landingData.gallery.length - 1 : prev - 1
    );
  };

  // Keyboard navigation untuk viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewerOpen) return;
      
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerOpen]);

  // --- TAMPILAN BARU (POPPINS & PROFESSIONAL LOOK) ---
  return (
    <>
      {/* Inject Font Poppins */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');`}
      </style>

      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] pb-6 overflow-x-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
        
        {/* === HERO SECTION (SCANNER) === */}
        {/* Desain Gelap Elegan agar fokus ke Kamera */}
        <div className="relative bg-[#111] text-white pt-8 pb-16 rounded-b-[3rem] shadow-2xl overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600 rounded-full blur-[100px]"></div>
                <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-600 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 max-w-md text-center">
                
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-8">
                    <div className="mb-3 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                        <HiOutlineCamera size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight uppercase">
                        Digital Check-in
                    </h1>
                    
                    {activeEvent ? (
                        <div className="mt-3 flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-semibold text-green-300 uppercase tracking-wider">
                                Event Active
                            </span>
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-400 mt-2 font-light tracking-wide">
                            Scan QR Code tiket anda
                        </p>
                    )}
                </div>

                {/* SCANNER FRAME (Professional Viewfinder Look) */}
                <div className="relative mx-auto w-full max-w-[320px] aspect-square bg-black rounded-[2rem] border-4 border-white/10 shadow-2xl overflow-hidden group">
                    <video
                        ref={videoRef}
                        className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Loading Overlay */}
                    {!cameraReady && (
                        <div className="absolute inset-0 bg-[#111] flex flex-col items-center justify-center z-20">
                            <div className="w-10 h-10 border-4 border-zinc-700 border-t-white rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                Initializing Camera...
                            </p>
                        </div>
                    )}

                    {/* Professional Viewfinder Overlay */}
                    {cameraReady && (
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            {/* Corners */}
                            <div className="absolute top-6 left-6 w-10 h-10 border-l-4 border-t-4 border-blue-500 rounded-tl-xl"></div>
                            <div className="absolute top-6 right-6 w-10 h-10 border-r-4 border-t-4 border-blue-500 rounded-tr-xl"></div>
                            <div className="absolute bottom-6 left-6 w-10 h-10 border-l-4 border-b-4 border-blue-500 rounded-bl-xl"></div>
                            <div className="absolute bottom-6 right-6 w-10 h-10 border-r-4 border-b-4 border-blue-500 rounded-br-xl"></div>
                            
                            {/* Scan Line */}
                            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-scan"></div>
                            
                            <p className="absolute bottom-8 w-full text-center text-[10px] text-white/70 font-medium tracking-widest uppercase">
                                Place QR Code Within Frame
                            </p>
                        </div>
                    )}
                </div>

                {/* Camera Controls & Upload Button */}
                <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                        onClick={toggleCamera}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-xs font-semibold uppercase tracking-wider backdrop-blur-md active:scale-95"
                    >
                        <HiOutlineRefresh className={!cameraReady ? "animate-spin" : ""} size={16} />
                        Switch Camera
                    </button>

                    {/* Upload QR Image Button */}
                    <button
                        onClick={handleUploadClick}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 border border-blue-500 hover:bg-blue-700 transition-all text-xs font-semibold uppercase tracking-wider backdrop-blur-md active:scale-95 shadow-lg shadow-blue-500/30"
                        title="Upload QR Code dari Galeri"
                    >
                        <HiOutlineUpload size={16} />
                        Upload QR
                    </button>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            </div>
        </div>

        {/* === CONTENT SECTION === */}
        <div className="container mx-auto px-4 lg:px-8 -mt-10 relative z-20">
            
            {activeEvent ? (
                <div className="flex flex-col gap-8 max-w-6xl mx-auto">
                    
                    {/* 1. HEADER & DETAILS */}
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-zinc-100">
                        {/* Title & Code */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-zinc-100 pb-8">
                            <div>
                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3">Official Event</span>
                                <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-900 leading-tight">{activeEvent.nama_event}</h2>
                            </div>
                            
                            {/* EVENT CODE (Visible on All Devices) */}
                            <div className="flex items-center justify-between md:block md:text-right bg-zinc-50 md:bg-transparent p-4 md:p-0 rounded-2xl border border-zinc-100 md:border-none">
                                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Event Code</p>
                                <p className="text-xl font-mono font-bold text-zinc-800">{activeEvent.event_code || 'EVT-XXXX'}</p>
                            </div>
                        </div>

                        {/* Date & Time Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-colors">
                                <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm"><HiOutlineCalendar size={24} /></div>
                                <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Date</p><p className="font-bold text-lg text-zinc-800">{formatEventDateRange(activeEvent.tanggal_event)} - {formatEventDateRange(activeEvent.checkin_end_time)}</p></div>
                            </div>
                            <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-orange-200 transition-colors">
                                <div className="p-3 bg-white text-orange-600 rounded-xl shadow-sm"><HiOutlineClock size={24} /></div>
                                <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Check-in Time</p><p className="font-bold text-lg text-zinc-800">{formatTime(activeEvent.jam_masuk_mulai)} - {formatTime(activeEvent.jam_masuk_selesai)} WIB</p></div>
                            </div>
                        </div>
                    </div>

                    {/* 2. DESCRIPTION (Separated, No Box) */}
                    <div className="px-4 md:px-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><HiOutlineInformationCircle size={18} /></div>
                            <h3 className="text-lg font-bold text-zinc-900">About This Event</h3>
                        </div>
                        <p className="text-base text-justify text-zinc-600 leading-loose whitespace-pre-wrap max-w-4xl">
                            {landingData.description}
                        </p>
                    </div>

                    {/* 3. GALLERY */}
                    <div className="pt-8 border-t border-zinc-200">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-lg"><HiOutlinePhotograph size={20} /></div>
                            <div><h3 className="text-lg font-bold text-zinc-900 leading-none">Highlights</h3><p className="text-xs text-zinc-400 font-medium mt-1">Dokumentasi kegiatan event</p></div>
                        </div>
                        
                        {landingData.gallery.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {landingData.gallery.map((item, index) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => openViewer(index)}
                                        className="group relative h-72 w-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                                    >
                                        <img src={item.src} alt={item.caption || "Gallery"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                                        <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="w-8 h-1 bg-blue-500 rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity delay-100"></div>
                                            <p className="text-white font-bold text-lg leading-tight drop-shadow-md">{item.caption || "Event Moment"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-zinc-200">
                                <div className="p-4 bg-zinc-50 rounded-full mb-3"><HiLightningBolt size={30} className="text-zinc-300" /></div>
                                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Coming Soon</p>
                                <p className="text-xs text-zinc-400 mt-1">Dokumentasi belum tersedia.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* STATE: TIDAK ADA EVENT AKTIF */
                <div className="max-w-md mx-auto mt-8 bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-zinc-100/50">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-50 rounded-full mb-6 shadow-inner">
                        <HiOutlineCalendar size={36} className="text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">Tidak Ada Event</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed max-w-[260px] mx-auto">
                        Saat ini belum ada event yang sedang berlangsung atau status event sudah selesai.
                    </p>
                    <div className="mt-8 pt-8 border-t border-zinc-50">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Check back later</p>
                    </div>
                </div>
            )}

            <div className="mt-6 max-w-md mx-auto text-center border-t border-zinc-200 pt-3 pb-2">
              <p className="text-xs font-medium text-zinc-400 tracking-wide">
                © {new Date().getFullYear()} bintangin.com · Event System Attendance
              </p>
            </div>

        </div>
      </div>

      {/* === IMAGE VIEWER MODAL === */}
      {viewerOpen && landingData.gallery.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95"
            aria-label="Close"
          >
            <HiOutlineX size={24} className="text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
            <p className="text-white text-sm font-semibold">
              {currentImageIndex + 1} / {landingData.gallery.length}
            </p>
          </div>

          {/* Previous Button */}
          {landingData.gallery.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95"
              aria-label="Previous"
            >
              <HiOutlineChevronLeft size={24} className="text-white" />
            </button>
          )}

          {/* Next Button */}
          {landingData.gallery.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95"
              aria-label="Next"
            >
              <HiOutlineChevronRight size={24} className="text-white" />
            </button>
          )}

          {/* Main Image */}
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center px-4 py-16">
            <img
              src={landingData.gallery[currentImageIndex].src}
              alt={landingData.gallery[currentImageIndex].caption || "Gallery"}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Caption */}
            {landingData.gallery[currentImageIndex].caption && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 max-w-2xl w-full px-6 py-4 bg-black/60 backdrop-blur-md rounded-t-2xl">
                <p className="text-white text-center font-semibold text-lg">
                  {landingData.gallery[currentImageIndex].caption}
                </p>
              </div>
            )}
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeViewer}
          ></div>
        </div>
      )}
    </>
  );
}