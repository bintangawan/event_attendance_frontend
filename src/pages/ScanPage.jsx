import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Tambah useParams
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
  HiCheckCircle,
  HiXCircle,
  HiUser,
  HiLocationMarker,
  HiOutlineQrcode,
  HiOutlineBan,
} from "react-icons/hi";

export default function ScanPage() {
  const { eventCode } = useParams(); // Ambil eventCode dari URL
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("scan");
  const [loading, setLoading] = useState(false);

  const [landingData, setLandingData] = useState({
    description: "",
    gallery: [],
    attendees: [],
  });

  // State untuk Image Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // State untuk Modal Validasi
  const [validationModal, setValidationModal] = useState({
    open: false,
    valid: false,
    data: null,
    message: "",
  });

  // --- FETCH EVENT DETAILS + ATTENDEES (UPDATED) ---
  const fetchEventDetails = useCallback(async () => {
    try {
      // API CALL DIGANTI: Menggunakan endpoint spesifik public event berdasarkan kode
      const res = await api.get(`/api/eventdetails/public/${eventCode}`);
      
      if (res.data?.data) {
        const { event, description, gallery, attendees } = res.data.data;
        if (event) {
          setActiveEvent(event);
          document.title = `Check-in: ${event.nama_event}`;
        } else {
          document.title = "Event Tidak Ditemukan";
        }
        setLandingData({
          description: description || "-",
          gallery: gallery || [],
          attendees: attendees || [],
        });
      }
    } catch (err) {
      console.error("Gagal memuat detail event:", err);
      toast.error("Event tidak ditemukan");
      navigate("/"); // Redirect ke home jika event invalid
    }
  }, [eventCode, navigate]);

  // --- LOGIC VALIDASI TIKET (UPDATED) ---
  const validateToken = async (token) => {
    try {
      setLoading(true);
      if (scannerRef.current) scannerRef.current.stop();

      // Kirim eventCode saat validasi
      const res = await api.post("/api/validator/validate", { 
          token,
          eventCode 
      });

      if (res.data.valid) {
        setValidationModal({
          open: true,
          valid: true,
          code: res.data.code, // Simpan code (SUCCESS / ALREADY_CHECKED_IN)
          data: res.data.data,
          message: "Tiket Valid!",
        });
        toast.success("Tiket Valid!");
        await fetchEventDetails();
      }
    } catch (err) {
      console.error(err);
      // Tangani error response dari backend
      const errorCode = err.response?.data?.code;
      const errorMsg = err.response?.data?.message || "Tiket Tidak Valid";
      const errorData = err.response?.data?.data; // Data tambahan (misal nama peserta walau salah event)

      setValidationModal({
        open: true,
        valid: false,
        code: errorCode, // Simpan error code (WRONG_EVENT / dll)
        data: errorData, // Simpan data jika ada
        message: errorMsg,
      });
      toast.error("Gagal Memvalidasi Tiket");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC SCANNER ---
  const initScanner = useCallback(
    async (mode) => {
      // Pastikan video element ada
      if (!videoRef.current) return;

      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      // Hanya jalankan scanner jika tab aktif "scan", modal tutup, tidak loading, dan event AKTIF
      if (activeTab === "scan" && !validationModal.open && !loading && activeEvent?.status_event === 'aktif') {
        try {
          const videoEl = videoRef.current;
          
          const scanner = new QrScanner(
            videoEl,
            (result) => {
              if (result?.data) {
                validateToken(result.data);
              }
            },
            {
              preferredCamera: mode,
              highlightScanRegion: true,
              highlightCodeOutline: true,
              returnDetailedScanResult: true,
            },
          );

          scannerRef.current = scanner;
          await scanner.start();

          requestAnimationFrame(() => {
            setCameraReady(true);
          });
        } catch (err) {
          console.error("Scanner init error:", err);
          // Jangan toast error akses kamera terus menerus jika di desktop tanpa kamera
        }
      }
    },
    [activeTab, validationModal.open, loading, activeEvent],
  );

  // Effect untuk inisialisasi scanner (Depend on activeEvent)
  useEffect(() => {
    if (activeEvent) {
        initScanner(facingMode);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [activeTab, validationModal.open, facingMode, initScanner, loading, activeEvent]);

  // Effect untuk fetch data awal saat mount atau eventCode berubah
  useEffect(() => {
    if (eventCode) {
        fetchEventDetails();
    }
    return () => {
      document.title = "Event Attendance";
    };
  }, [eventCode, fetchEventDetails]);

  const toggleCamera = () => {
    setCameraReady(false);
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const formatEventDateRange = (startDate, endDate) => {
    if (!startDate) return "-";

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    const fmt = (d, opt) => d.toLocaleDateString("id-ID", opt);

    if (start.toDateString() === end.toDateString()) {
      return fmt(start, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${start.getDate()} - ${fmt(end, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`;
    }

    return `${fmt(start, { day: "numeric", month: "short" })} - ${fmt(end, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "00:00";
    return timeString.substring(0, 5);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTimeFromDate = (date) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // --- HANDLER UNTUK UPLOAD QR IMAGE ---
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeEvent?.status_event !== 'aktif') {
        toast.error("Event sudah selesai. Tidak bisa scan.");
        return;
    }

    try {
      setLoading(true);
      const result = await QrScanner.scanImage(file);
      if (result) {
        validateToken(result);
      }
    } catch (err) {
      console.error(err);
      toast.error("QR Code tidak terbaca pada gambar");
      setLoading(false);
    }
    e.target.value = "";
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
      prev === landingData.gallery.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? landingData.gallery.length - 1 : prev - 1,
    );
  };

  // --- HANDLER UNTUK MODAL VALIDASI ---
  const closeValidationModal = () => {
    setValidationModal({ open: false, valid: false, data: null, message: "" });
    setLoading(false);

    // Restart scanner setelah modal ditutup jika event masih aktif
    if (activeTab === "scan" && activeEvent?.status_event === 'aktif') {
      setTimeout(() => {
        initScanner(facingMode);
      }, 100);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewerOpen) {
        if (e.key === "Escape") closeViewer();
        if (e.key === "ArrowRight") nextImage();
        if (e.key === "ArrowLeft") prevImage();
      }
      if (validationModal.open && e.key === "Escape") {
        closeValidationModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerOpen, validationModal.open]);

  // --- RENDER ---
  const isEventActive = activeEvent?.status_event === 'aktif';

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');`}
      </style>

      <div
        className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] pb-6 overflow-x-hidden"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* === HERO SECTION (SCANNER) === */}
        <div className={`relative pt-8 pb-16 rounded-b-[3rem] shadow-2xl overflow-hidden ${isEventActive ? 'bg-[#111] text-white' : 'bg-zinc-200 text-zinc-800'}`}>
          
          {/* Background Accent */}
          {isEventActive && (
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600 rounded-full blur-[100px]"></div>
                <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-600 rounded-full blur-[80px]"></div>
            </div>
          )}

          <div className="relative z-10 container mx-auto px-4 max-w-md text-center">
            
            {/* Tombol Kembali ke Landing Page */}
            <button onClick={() => navigate('/')} className={`absolute top-0 left-4 p-2 rounded-full border transition-all z-50 ${isEventActive ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white' : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-600'}`}>
                <HiOutlineChevronLeft size={20}/>
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className={`mb-3 p-3 backdrop-blur-md rounded-2xl border shadow-lg ${isEventActive ? 'bg-white/10 border-white/10' : 'bg-white border-zinc-200'}`}>
                <HiOutlineCamera size={28} className={isEventActive ? "text-white" : "text-zinc-500"} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight uppercase">
                {isEventActive ? "Digital Check-in" : "Event Selesai"}
              </h1>

              {activeEvent ? (
                <div className={`mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm border ${isEventActive ? 'bg-green-500/20 border-green-500/30' : 'bg-zinc-300/50 border-zinc-400/30'}`}>
                  {isEventActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                  )}
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isEventActive ? 'text-green-300' : 'text-zinc-600'}`}>
                    {isEventActive ? "Scanner Aktif" : "Tidak Menerima Check-in"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 mt-2 font-light tracking-wide">
                  Memuat data event...
                </p>
              )}
            </div>

            {/* TABS (Hanya muncul jika Event Aktif) */}
            {isEventActive && (
                <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-white/20 mb-6">
                <button
                    onClick={() => {
                    setActiveTab("scan");
                    setValidationModal({
                        open: false, valid: false, data: null, message: "",
                    });
                    }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "scan"
                        ? "bg-white text-[#1A1A1A] shadow-md"
                        : "text-white/60 hover:bg-white/10"
                    }`}
                >
                    <HiOutlineQrcode size={18} /> Live Scan
                </button>
                <button
                    onClick={() => {
                    setActiveTab("upload");
                    setValidationModal({
                        open: false, valid: false, data: null, message: "",
                    });
                    }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "upload"
                        ? "bg-white text-[#1A1A1A] shadow-md"
                        : "text-white/60 hover:bg-white/10"
                    }`}
                >
                    <HiOutlineUpload size={18} /> Upload Image
                </button>
                </div>
            )}

            {/* SCANNER/UPLOAD AREA */}
            <div className="relative mx-auto w-full max-w-[320px] bg-white rounded-[2rem] shadow-2xl overflow-hidden">
              
              {isEventActive ? (
                  <>
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#1A1A1A] rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-sm uppercase tracking-widest text-zinc-500">
                            Memeriksa Tiket...
                        </p>
                        </div>
                    )}

                    {activeTab === "scan" ? (
                        <div className="relative aspect-square bg-black">
                        <video
                            ref={videoRef}
                            className="h-full w-full object-cover opacity-90"
                        />

                        {!cameraReady && (
                            <div className="absolute inset-0 bg-[#111] flex flex-col items-center justify-center z-20">
                            <div className="w-10 h-10 border-4 border-zinc-700 border-t-white rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                Initializing Camera...
                            </p>
                            </div>
                        )}

                        {cameraReady && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-500 rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-500 rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-500 rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-500 rounded-br-xl"></div>
                                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_15px_red] animate-bounce"></div>
                                </div>
                            </div>

                            <p className="absolute bottom-8 w-full text-center text-[10px] text-white/70 font-medium tracking-widest uppercase">
                                Arahkan kamera ke QR Code
                            </p>
                            </div>
                        )}
                        </div>
                    ) : (
                        <div className="aspect-square flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-100 m-4 rounded-3xl bg-zinc-50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <HiOutlineUpload size={32} className="text-zinc-400" />
                        </div>
                        <p className="text-sm font-bold text-zinc-600 mb-1">
                            Upload QR Code
                        </p>
                        <p className="text-xs text-zinc-400 mb-6 text-center">
                            Pilih gambar tiket dari galeri perangkat Anda
                        </p>

                        <label className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                            Pilih File Gambar
                            <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            />
                        </label>
                        </div>
                    )}
                  </>
              ) : (
                  /* TAMPILAN JIKA EVENT SELESAI */
                  <div className="aspect-square flex flex-col items-center justify-center p-8 bg-zinc-50 m-4 rounded-3xl">
                      <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center shadow-sm mb-4">
                          <HiOutlineCalendar size={32} className="text-zinc-400" />
                      </div>
                      <p className="text-sm font-bold text-zinc-600 text-center mb-2">Event Telah Berakhir</p>
                      <p className="text-xs text-zinc-400 text-center leading-relaxed">
                          Terima kasih atas partisipasi Anda. Anda dapat melihat dokumentasi di bawah ini.
                      </p>
                  </div>
              )}
            </div>

            {/* Camera Controls (Hanya jika aktif & mode scan) */}
            {isEventActive && activeTab === "scan" && (
              <div className="mt-6 flex items-center justify-center">
                <button
                  onClick={toggleCamera}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-xs font-semibold uppercase tracking-wider backdrop-blur-md active:scale-95"
                >
                  <HiOutlineRefresh
                    className={!cameraReady ? "animate-spin" : ""}
                    size={16}
                  />
                  Switch Camera
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* === CONTENT SECTION === */}
        <div className="container mx-auto px-4 lg:px-8 -mt-10 relative z-20">
          {activeEvent ? (
            <div className="flex flex-col gap-8 max-w-6xl mx-auto">
              {/* 1. HEADER & DETAILS */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-zinc-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-zinc-100 pb-8">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3">
                      Official Event
                    </span>
                    <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-900 leading-tight">
                      {activeEvent.nama_event}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between md:block md:text-right bg-zinc-50 md:bg-transparent p-4 md:p-0 rounded-2xl border border-zinc-100 md:border-none">
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                      Event Code
                    </p>
                    <p className="text-xl font-mono font-bold text-zinc-800">
                      {activeEvent.event_code || "EVT-XXXX"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-colors">
                    <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm">
                      <HiOutlineCalendar size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                        Date
                      </p>
                      <p className="font-bold text-lg text-zinc-800">
                        {formatEventDateRange(activeEvent.tanggal_event, activeEvent.checkin_end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-orange-200 transition-colors">
                    <div className="p-3 bg-white text-orange-600 rounded-xl shadow-sm">
                      <HiOutlineClock size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                        Check-in Time
                      </p>
                      <p className="font-bold text-lg text-zinc-800">
                        {formatTime(activeEvent.jam_masuk_mulai)} -{" "}
                        {formatTime(activeEvent.jam_masuk_selesai)} WIB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DESCRIPTION */}
              <div className="px-4 md:px-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <HiOutlineInformationCircle size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    About This Event
                  </h3>
                </div>
                <p className="text-base text-justify text-zinc-600 leading-loose whitespace-pre-wrap max-w-4xl">
                  {landingData.description}
                </p>
              </div>

              {/* 3. GALLERY */}
              <div className="pt-8 border-t border-zinc-200">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-lg">
                    <HiOutlinePhotograph size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 leading-none">
                      Highlights
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium mt-1">
                      Dokumentasi kegiatan event
                    </p>
                  </div>
                </div>

                {landingData.gallery.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {landingData.gallery.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => openViewer(index)}
                        className="group relative h-72 w-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                      >
                        <img
                          src={item.src}
                          alt={item.caption || "Gallery"}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                        <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="w-8 h-1 bg-blue-500 rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity delay-100"></div>
                          <p className="text-white font-bold text-lg leading-tight drop-shadow-md">
                            {item.caption || "Event Moment"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-zinc-200">
                    <div className="p-4 bg-zinc-50 rounded-full mb-3">
                      <HiLightningBolt size={30} className="text-zinc-300" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                      Coming Soon
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Dokumentasi belum tersedia.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. ATTENDEES LIST */}
              <div className="pt-8 border-t border-zinc-200">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg">
                    <HiUser size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 leading-none">
                      Daftar Kehadiran
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium mt-1">
                      Peserta yang sudah melakukan check-in
                    </p>
                  </div>
                </div>

                {landingData.attendees.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-md border border-zinc-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-600 uppercase tracking-wider">
                              No
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-600 uppercase tracking-wider">
                              Nama
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-600 uppercase tracking-wider">
                              Waktu Check-in
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-zinc-600 uppercase tracking-wider">
                              Status Konsumsi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {landingData.attendees.map((attendee, index) => (
                            <tr
                              key={index}
                              className="hover:bg-zinc-50 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm text-zinc-800 font-medium">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                    {attendee.nama?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-semibold text-zinc-800">
                                    {attendee.nama}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-zinc-600">
                                {formatDateTime(attendee.jam_masuk)} WIB
                              </td>
                              <td className="px-6 py-4 text-center">
                                {attendee.status_konsumsi === 1 ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                    <HiCheckCircle size={14} />
                                    Sudah Diambil
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                    <HiXCircle size={14} />
                                    Belum Diambil
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200">
                      <p className="text-sm text-zinc-600">
                        Total Peserta Hadir:{" "}
                        <span className="font-bold text-zinc-900">
                          {landingData.attendees.length}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-zinc-200">
                    <div className="p-4 bg-zinc-50 rounded-full mb-3">
                      <HiUser size={30} className="text-zinc-300" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                      Belum Ada Peserta
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Peserta akan muncul setelah melakukan check-in.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto mt-8 bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-zinc-100/50">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-50 rounded-full mb-6 shadow-inner">
                <HiOutlineCalendar size={36} className="text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Tidak Ada Event
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-[260px] mx-auto">
                Event tidak ditemukan atau ID salah.
              </p>
              <div className="mt-8 pt-8 border-t border-zinc-50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Check back later
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 max-w-md mx-auto text-center border-t border-zinc-200 pt-3 pb-2">
            <p className="text-xs font-medium text-zinc-400 tracking-wide">
              © {new Date().getFullYear()} bintangin.com · Event System
              Attendance
            </p>
          </div>
        </div>
      </div>

      {/* === IMAGE VIEWER MODAL === */}
      {viewerOpen && landingData.gallery.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95"
            aria-label="Close"
          >
            <HiOutlineX size={24} className="text-white" />
          </button>

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
            <p className="text-white text-sm font-semibold">
              {currentImageIndex + 1} / {landingData.gallery.length}
            </p>
          </div>

          {landingData.gallery.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95"
                aria-label="Previous"
              >
                <HiOutlineChevronLeft size={24} className="text-white" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95"
                aria-label="Next"
              >
                <HiOutlineChevronRight size={24} className="text-white" />
              </button>
            </>
          )}

          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center px-4 py-16">
            <img
              src={landingData.gallery[currentImageIndex].src}
              alt={landingData.gallery[currentImageIndex].caption || "Gallery"}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />

            {landingData.gallery[currentImageIndex].caption && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 max-w-2xl w-full px-6 py-4 bg-black/60 backdrop-blur-md rounded-t-2xl">
                <p className="text-white text-center font-semibold text-lg">
                  {landingData.gallery[currentImageIndex].caption}
                </p>
              </div>
            )}
          </div>

          <div className="absolute inset-0 -z-10" onClick={closeViewer}></div>
        </div>
      )}

      {/* === VALIDATION MODAL (SAMA SEPERTI TICKETVALIDATORPAGE) === */}
      {/* === VALIDATION MODAL (UPDATED) === */}
      {validationModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            <div className="p-8 text-center">
              
              {/* --- KONDISI SUKSES (VALID) --- */}
              {validationModal.valid ? (
                <>
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <HiCheckCircle size={48} />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">
                    {validationModal.data?.sudahCheckin
                      ? "SUDAH TERDAFTAR!"
                      : "CHECK-IN BERHASIL!"}
                  </h2>
                  {validationModal.data?.sudahCheckin && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4 border border-amber-200">
                      Peserta sudah melakukan check-in sebelumnya
                    </p>
                  )}

                  {/* INFO PESERTA (Sama seperti sebelumnya) */}
                  <div className="w-full space-y-4 text-left">
                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Data Peserta</p>
                      <div className="flex items-start gap-3 mb-2">
                        <HiUser className="mt-1 text-zinc-400 shrink-0" />
                        <div>
                          <p className="font-bold text-zinc-800">{validationModal.data?.peserta?.nama}</p>
                          <p className="text-xs text-zinc-500">{validationModal.data?.peserta?.no_hp}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <HiLocationMarker className="mt-1 text-zinc-400 shrink-0" />
                        <p className="text-sm text-zinc-600">{validationModal.data?.peserta?.domisili}</p>
                      </div>
                    </div>
                    {/* ... (Info Detail Event boleh tetap ada atau dihapus jika mau ringkas) ... */}
                  </div>
                </>
              ) : (
                /* --- KONDISI ERROR (INVALID / SALAH EVENT) --- */
                <>
                  {validationModal.code === "WRONG_EVENT" ? (
                      // Tampilan Khusus Salah Event
                      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <HiOutlineBan size={48} />
                      </div>
                  ) : (
                      // Tampilan Error Umum (Tidak Ketemu/Rusak)
                      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <HiXCircle size={48} />
                      </div>
                  )}

                  <h2 className={`text-2xl font-black mb-2 ${validationModal.code === "WRONG_EVENT" ? "text-amber-600" : "text-red-600"}`}>
                    {validationModal.code === "WRONG_EVENT" ? "SALAH EVENT" : "TIKET TIDAK VALID"}
                  </h2>
                  
                  <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                    {validationModal.message || "QR Code tidak valid."}
                  </p>

                  {/* Jika Salah Event, Tampilkan Info Tambahan jika ada */}
                  {validationModal.code === "WRONG_EVENT" && validationModal.data?.peserta && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left text-xs text-amber-800 mb-6">
                          <p className="font-bold mb-1">Info Tiket:</p>
                          <p>Nama: <b>{validationModal.data.peserta.nama}</b></p>
                          <p>Untuk Event: <b>{validationModal.data.event?.nama}</b></p>
                      </div>
                  )}
                </>
              )}

              <button
                onClick={closeValidationModal}
                className="mt-2 w-full py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                Scan Tiket Lain
              </button>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={closeValidationModal}></div>
        </div>
      )}
    </>
  );
}