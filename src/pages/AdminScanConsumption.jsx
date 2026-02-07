import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import QrScanner from "qr-scanner";
import api from "../api/api.js";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar.jsx";
import {
  HiOutlineQrcode,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineArrowLeft,
  HiLightningBolt,
  HiOutlineUpload,
  HiUser,
  HiClock,
  HiExclamation
} from "react-icons/hi";

export default function AdminScanConsumption() {
  const { id } = useParams(); // id adalah eventId dari URL
  const navigate = useNavigate();
  
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // State UI
  const [activeTab, setActiveTab] = useState("scan"); 
  const [scanResult, setScanResult] = useState(null); // 'success', 'error', 'duplicate', 'not_present', 'wrong_event'
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- LOGIC: PROSES KLAIM KONSUMSI ---
  const handleClaim = useCallback(async (tokenRaw) => {
    if (!tokenRaw) return;
    
    // Stop scanner agar tidak double request
    if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
    }
    setLoading(true);

    try {
      // PERUBAHAN: Kirim ID Event di URL agar divalidasi backend
      const res = await api.post(`/api/consumption/claim/${id}`, { token: tokenRaw });
      
      if (res.data.code === "DUPLICATE") {
        setScanResult("duplicate");
        setResultData(res.data.detail);
        toast.error("Konsumsi Sudah Diambil!");
      } else {
        setScanResult("success");
        setResultData(res.data.data);
        toast.success("Konsumsi Berhasil Diambil!");
      }
      
    } catch (err) {
      if (err.response?.status === 403) {
        // KASUS: BELUM REGISTRASI ULANG
        setScanResult("not_present");
        setResultData({ message: err.response.data.message });
        toast.error("Peserta Belum Check-in!");
      } else if (err.response?.data?.code === "WRONG_EVENT") {
        // KASUS: SALAH EVENT (BARU)
        setScanResult("wrong_event");
        setResultData({ message: err.response.data.message });
        toast.error("Tiket Salah Event!");
      } else {
        // ERROR LAIN (404, 500)
        console.error(err);
        setScanResult("error");
        setResultData({ message: err.response?.data?.message || "Tiket Tidak Valid" });
        toast.error("Gagal Memproses Tiket");
      }
    } finally {
      setLoading(false);
    }
  }, [id]); // Dependency id penting

  // --- LOGIC: SCANNER KAMERA ---
  useEffect(() => {
    if (activeTab === "scan" && !scanResult && !loading) {
      const startScanner = async () => {
        try {
          const videoEl = videoRef.current;
          if (!videoEl) return;

          const scanner = new QrScanner(
            videoEl,
            (result) => handleClaim(result?.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              returnDetailedScanResult: true,
              preferredCamera: "environment"
            }
          );

          scannerRef.current = scanner;
          await scanner.start();
        } catch (e) {
          console.error("Camera error:", e);
        }
      };
      startScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [activeTab, scanResult, loading, handleClaim]);

  // --- LOGIC: UPLOAD GAMBAR ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await QrScanner.scanImage(file);
      if (result) {
        handleClaim(result);
      }
    } catch (err) {
      console.error(err);
      toast.error("QR Code tidak terbaca pada gambar");
      setLoading(false);
    }
    e.target.value = "";
  };

  const resetScanner = () => {
    setScanResult(null);
    setResultData(null);
    setLoading(false);
    setActiveTab("scan"); 
  };

  // Formatter
  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');`}</style>
      
      <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
        
        <Sidebar />

        <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 overflow-x-hidden flex flex-col items-center">
          
          <div className="max-w-md w-full">
            
            {/* HEADER */}
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                  <HiLightningBolt className="text-yellow-500" /> Pos Konsumsi
                </h1>
                <p className="text-sm text-zinc-500">Scan QR Tiket untuk pengambilan konsumsi</p>
              </div>
              <Link 
                to={`/admin/events/${id}/details`}
                className="p-2 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-all text-zinc-400 hover:text-zinc-900"
              >
                <HiOutlineArrowLeft size={20} />
              </Link>
            </header>

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

            {/* MAIN CARD AREA */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-zinc-100 overflow-hidden relative min-h-[420px]">
              
              {/* LOADING OVERLAY */}
              {loading && (
                <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#1A1A1A] rounded-full animate-spin mb-4"></div>
                  <p className="font-bold text-sm uppercase tracking-widest text-zinc-500">Memverifikasi Data...</p>
                </div>
              )}

              {!scanResult ? (
                // --- MODE INPUT ---
                <div className="h-full flex flex-col">
                  {activeTab === "scan" ? (
                    <div className="relative h-[420px] bg-black group">
                      <video ref={videoRef} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"></video>
                      
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                          <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-yellow-400 rounded-tl-xl"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-yellow-400 rounded-tr-xl"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-yellow-400 rounded-bl-xl"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-yellow-400 rounded-br-xl"></div>
                          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-yellow-400 shadow-[0_0_15px_#facc15] animate-bounce"></div>
                        </div>
                      </div>
                      <p className="absolute bottom-8 w-full text-center text-white/70 text-xs font-medium uppercase tracking-widest">Arahkan kamera ke QR Code</p>
                    </div>
                  ) : (
                    <div className="h-[420px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-100 m-4 rounded-3xl bg-zinc-50">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <HiOutlineUpload size={36} className="text-zinc-400" />
                      </div>
                      <p className="text-sm font-bold text-zinc-600 mb-1">Upload QR Code</p>
                      <p className="text-xs text-zinc-400 mb-6 text-center max-w-[200px]">Ambil gambar QR Code dari galeri perangkat Anda</p>
                      
                      <label className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                        Pilih File Gambar
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                // --- RESULT VIEW ---
                <div className="p-8 h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                  
                  {/* ICON STATUS & COLOR LOGIC */}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner ${
                    scanResult === 'success' ? 'bg-green-100 text-green-600' :
                    scanResult === 'duplicate' ? 'bg-orange-100 text-orange-600' :
                    scanResult === 'not_present' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {scanResult === 'success' && <HiOutlineCheckCircle size={64} />}
                    {scanResult === 'duplicate' && <HiOutlineQrcode size={64} />}
                    {scanResult === 'not_present' && <HiExclamation size={64} />}
                    {(scanResult === 'error' || scanResult === 'wrong_event') && <HiOutlineXCircle size={64} />}
                  </div>

                  {/* JUDUL STATUS */}
                  <h2 className={`text-2xl font-black uppercase mb-1 ${
                    scanResult === 'success' ? 'text-green-600' :
                    scanResult === 'duplicate' ? 'text-orange-600' :
                    scanResult === 'not_present' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {scanResult === 'success' ? "BERHASIL!" : 
                     scanResult === 'duplicate' ? "SUDAH DIAMBIL!" : 
                     scanResult === 'not_present' ? "BELUM CHECK-IN" :
                     scanResult === 'wrong_event' ? "SALAH EVENT" :
                     "GAGAL!"}
                  </h2>

                  <p className="text-sm text-zinc-500 mb-8 font-medium px-4">
                    {scanResult === 'success' ? "Silakan berikan konsumsi kepada peserta." : 
                     scanResult === 'duplicate' ? "Peserta ini sudah mengambil jatah konsumsi." : 
                     scanResult === 'not_present' ? "Peserta belum registrasi ulang. Arahkan ke meja Check-in." :
                     scanResult === 'wrong_event' ? "Tiket ini bukan untuk acara ini." :
                     resultData?.message}
                  </p>

                  {/* INFO PESERTA CARD (Jika ada data) */}
                  {resultData && resultData.nama && (
                    <div className="w-full bg-zinc-50 p-5 rounded-2xl border border-zinc-100 text-left mb-6 space-y-3">
                      
                      <div className="flex items-start gap-3">
                        <HiUser className="mt-1 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nama Peserta</p>
                          <p className="font-bold text-zinc-800 text-lg leading-tight">{resultData.nama}</p>
                        </div>
                      </div>

                      {(resultData.jam || resultData.jam_ambil) && (
                        <div className="flex items-start gap-3 border-t border-zinc-200 pt-3">
                          <HiClock className="mt-1 text-zinc-400 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Waktu Pengambilan</p>
                            <p className="font-mono text-sm text-zinc-600 font-bold">
                              {formatTime(resultData.jam || resultData.jam_ambil)} WIB
                            </p>
                            <p className="text-xs text-zinc-400">
                              {formatDate(resultData.jam || resultData.jam_ambil)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={resetScanner}
                    className="w-full py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <HiOutlineRefresh size={20} /> Scan Berikutnya
                  </button>

                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}