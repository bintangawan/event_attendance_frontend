import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import toast from "react-hot-toast";
import api from "../api/api.js";
import {
  HiOutlineRefresh,
  HiOutlineCamera,
  HiOutlineHashtag,
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
  const navigate = useNavigate();

  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [activeEvent, setActiveEvent] = useState(null);

  /**
   * 1. Inisialisasi Scanner
   * Dibungkus useCallback agar referensi stabil
   */
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
          },
        );

        scannerRef.current = scanner;
        await scanner.start();

        requestAnimationFrame(() => {
          setCameraReady(true);
        });
      } catch (err) {
        console.error("Scanner Error:", err);
        toast.error("Kamera gagal diakses.");
      }
    },
    [navigate],
  );

  /**
   * 2. Effect Utama
   * Mengambil data API, Inisialisasi Scanner, dan Update Document Title
   */
  useEffect(() => {
    let isMounted = true;

    const loadActiveEvent = async () => {
      try {
        const res = await api.get("/api/active-events");
        if (isMounted && res.data && res.data.length > 0) {
          const event = res.data[0];
          setActiveEvent(event);
          // Set Title Dinamis
          document.title = `Check-in: ${event.nama_event}`;
        } else {
          document.title = "Absensi Kehadiran";
        }
      } catch (err) {
        console.error("Gagal mengambil data event:", err);
        document.title = "Absensi Kehadiran";
      }
    };

    loadActiveEvent();
    initScanner(facingMode);

    return () => {
      isMounted = false;
      // Reset Title saat pindah halaman
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

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1A1A1A] text-[#FAF9F5] shadow-xl mb-4">
            <HiOutlineCamera size={28} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
              Absensi Kehadiran
            </h1>

            {activeEvent ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                  {activeEvent.nama_event}
                </span>
              </div>
            ) : (
              <p className="text-zinc-400 font-medium text-[10px] mt-2 uppercase tracking-widest italic">
                Arahkan kamera ke QR Code Event
              </p>
            )}
          </div>
        </div>

        {/* Scanner Container */}
        <div className="relative rounded-[2.5rem] border-8 border-white bg-white shadow-2xl overflow-hidden aspect-[3/4]">
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-full h-0.5 bg-red-500/40 absolute top-1/2 left-0 animate-bounce shadow-[0_0_15px_red]"></div>
            <div className="w-48 h-48 border-2 border-white/40 rounded-3xl"></div>
          </div>

          <video
            ref={videoRef}
            className="h-full w-full object-cover rounded-[1.8rem]"
          />

          {!cameraReady && (
            <div className="absolute inset-0 bg-[#FAF9F5] flex flex-col items-center justify-center z-20">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#1A1A1A] rounded-full animate-spin mb-3"></div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Menghubungkan Kamera
              </p>
            </div>
          )}
        </div>

        {/* Buttons & Info Box */}
        <div className="mt-6 flex flex-col gap-4">
          <button
            onClick={toggleCamera}
            disabled={!cameraReady}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-all font-bold text-sm uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-zinc-200/50"
          >
            <HiOutlineRefresh
              size={20}
              className={!cameraReady ? "animate-spin" : ""}
            />
            Ganti Kamera
          </button>

          {/* Info Box Dinamis */}
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 ${
              cameraReady
                ? "bg-zinc-100/50 border-zinc-200"
                : "bg-amber-50 border-amber-200 animate-pulse"
            }`}
          >
            <div
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                cameraReady ? "bg-green-500" : "bg-amber-500"
              }`}
            />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Status Sistem
              </span>
              <p className="text-[11px] leading-relaxed text-zinc-600 font-medium">
                {cameraReady
                  ? "Kamera aktif. Silakan arahkan lensa ke QR Code Event untuk memulai proses check-in otomatis."
                  : "Kamera tidak terdeteksi atau izin ditolak. Pastikan browser diizinkan mengakses kamera dan gunakan koneksi HTTPS."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
