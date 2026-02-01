import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import QrScanner from "qr-scanner";
import toast from "react-hot-toast";
import api from "../api/api.js";
import {
  HiOutlineQrcode,
  HiOutlineUpload,
  HiCheckCircle,
  HiXCircle,
  HiUser,
  HiLocationMarker,
  HiClock,
  HiCalendar,
  HiArrowLeft // Import icon panah
} from "react-icons/hi";

export default function TicketValidatorPage() {
  const navigate = useNavigate(); // Init navigate
  const videoRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("scan"); 
  const [scanner, setScanner] = useState(null);

  // --- LOGIC VALIDASI KE BACKEND ---
  const validateToken = async (token) => {
    try {
      setLoading(true);
      if (scanner) {
        scanner.stop();
        setScanner(null);
      }

      const res = await api.post("/api/validator/validate", { token });
      
      if (res.data.valid) {
        setScanResult({ valid: true, ...res.data.data });
        toast.success("Tiket Valid!");
      }
    } catch (err) {
      console.error(err);
      setScanResult({ 
        valid: false, 
        message: err.response?.data?.message || "Tiket Tidak Valid" 
      });
      toast.error("Tiket Gagal Divalidasi");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC SCANNER KAMERA ---
  useEffect(() => {
    if (activeTab === "scan" && !scanResult && !loading) {
      const startScanner = async () => {
        try {
          const qrScanner = new QrScanner(
            videoRef.current,
            (result) => {
                if (result?.data) validateToken(result.data);
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              returnDetailedScanResult: true,
            }
          );
          await qrScanner.start();
          setScanner(qrScanner);
        } catch (e) {
          console.error("Camera error", e);
        }
      };
      startScanner();
    }

    return () => {
      if (scanner) scanner.stop();
    };
    // eslint-disable-next-line
  }, [activeTab, scanResult]); 

  // --- LOGIC UPLOAD GAMBAR ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
  };

  const resetScan = () => {
    setScanResult(null);
    setLoading(false);
  };

  // FORMATTER
  const formatDate = (date) => new Date(date).toLocaleDateString("id-ID", { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  const formatTime = (date) => new Date(date).toLocaleTimeString("id-ID", { 
    hour: '2-digit', minute: '2-digit' 
  });

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');`}</style>
      
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] p-4 md:p-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="max-w-md mx-auto">
          
          {/* TOMBOL KEMBALI */}
          <div className="mb-6">
            <button 
              onClick={() => navigate("/")} 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-600 uppercase tracking-wider hover:bg-zinc-50 shadow-sm transition-all active:scale-95"
            >
              <HiArrowLeft size={16} /> Kembali ke Beranda
            </button>
          </div>

          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Validator Tiket</h1>
            <p className="text-sm text-zinc-500">Scan atau Upload QR Tiket Peserta</p>
          </div>

          {/* TABS */}
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-zinc-200 mb-6">
            <button 
              onClick={() => { setActiveTab("scan"); setScanResult(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "scan" ? "bg-[#1A1A1A] text-white shadow-md" : "text-zinc-400 hover:bg-zinc-50"}`}
            >
              <HiOutlineQrcode size={18} /> Live Scan
            </button>
            <button 
              onClick={() => { setActiveTab("upload"); setScanResult(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "upload" ? "bg-[#1A1A1A] text-white shadow-md" : "text-zinc-400 hover:bg-zinc-50"}`}
            >
              <HiOutlineUpload size={18} /> Upload Image
            </button>
          </div>

          {/* MAIN AREA */}
          <div className="bg-white rounded-[2rem] shadow-xl border border-zinc-100 overflow-hidden relative min-h-[400px]">
            
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#1A1A1A] rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-sm uppercase tracking-widest text-zinc-500">Memeriksa Tiket...</p>
              </div>
            )}

            {!scanResult ? (
              // MODE SCANNING / UPLOAD
              <div className="h-full flex flex-col">
                {activeTab === "scan" ? (
                  <div className="relative h-[400px] bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover opacity-90"></video>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-500 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-500 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-500 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-500 rounded-br-xl"></div>
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_15px_red] animate-bounce"></div>
                      </div>
                    </div>
                    <p className="absolute bottom-6 w-full text-center text-white/70 text-xs font-medium uppercase tracking-widest">Arahkan kamera ke QR Code</p>
                  </div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-100 m-4 rounded-3xl bg-zinc-50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <HiOutlineUpload size={32} className="text-zinc-400" />
                    </div>
                    <p className="text-sm font-bold text-zinc-600 mb-1">Upload QR Code</p>
                    <p className="text-xs text-zinc-400 mb-6 text-center">Pilih gambar tiket dari galeri perangkat Anda</p>
                    
                    <label className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                      Pilih File Gambar
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              // RESULT VIEW
              <div className="p-8 h-full flex flex-col items-center text-center animate-fadeIn">
                
                {scanResult.valid ? (
                  <>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <HiCheckCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 mb-1">TIKET VALID</h2>
                    <p className="text-xs font-mono text-zinc-400 bg-zinc-100 px-3 py-1 rounded-lg mb-8 border border-zinc-200">
                      {scanResult.token}
                    </p>

                    <div className="w-full space-y-4 text-left">
                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Data Peserta</p>
                        <div className="flex items-start gap-3 mb-2">
                          <HiUser className="mt-1 text-zinc-400 shrink-0" />
                          <div>
                            <p className="font-bold text-zinc-800">{scanResult.peserta.nama}</p>
                            <p className="text-xs text-zinc-500">{scanResult.peserta.no_hp}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <HiLocationMarker className="mt-1 text-zinc-400 shrink-0" />
                          <p className="text-sm text-zinc-600">{scanResult.peserta.domisili}</p>
                        </div>
                      </div>

                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Detail Event</p>
                        <div className="flex items-start gap-3 mb-2">
                          <HiCalendar className="mt-1 text-zinc-400 shrink-0" />
                          <div>
                            <p className="font-bold text-zinc-800 text-sm">{scanResult.event.nama}</p>
                            <p className="text-xs text-zinc-500">{formatDate(scanResult.event.tanggal)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <HiClock className="mt-1 text-zinc-400 shrink-0" />
                          <div>
                            <p className="text-xs text-zinc-500">Waktu Check-in:</p>
                            <p className="font-bold text-green-600 text-sm">{formatTime(scanResult.event.waktu_scan)} WIB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // INVALID STATE
                  <>
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <HiXCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-red-600 mb-2">TIKET TIDAK VALID</h2>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-8">
                      QR Code ini tidak terdaftar dalam sistem kami atau data telah rusak.
                    </p>
                  </>
                )}

                <button 
                  onClick={resetScan}
                  className="mt-8 w-full py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                  Scan Tiket Lain
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}