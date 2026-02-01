import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api.js";
import html2canvas from "html2canvas";
import {
  HiOutlineDownload,
  HiOutlineArrowLeft,
  HiOutlineTicket,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineLocationMarker,
} from "react-icons/hi";

export default function TicketPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/ticket/${token}`);
        setData(res.data);
      } catch {
        toast.error("Tiket tidak ditemukan atau tidak valid");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const formatJam = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    const loadId = toast.loading("Mendownload ticket...");

    try {
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // Skala lebih tinggi untuk hasil gambar lebih tajam
        backgroundColor: "#FAF9F5",
        useCORS: true,
        allowTaint: false,
        logging: false,
        onclone: (clonedDoc) => {
          const container = clonedDoc.getElementById("ticket-download-area");
          if (container) {
            container.style.color = "#ffffff";
            container.style.backgroundColor = "#121212";
          }
        },
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Tiket_${data?.participant?.nama || "Event"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(loadId);
      toast.success("Berhasil disimpan!");
    } catch (err) {
      console.error("Critical Render Error:", err);
      toast.dismiss(loadId);
      toast.error("Format warna browser tidak didukung. Gunakan Screenshot.");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-bold animate-pulse text-zinc-400 uppercase tracking-widest">
        Memuat Tiket...
      </div>
    );
  if (!data)
    return (
      <div className="p-10 text-center font-bold text-red-500 uppercase tracking-widest">
        Data tidak ditemukan
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FAF9F5] p-6 font-sans text-zinc-900">
      <div className="mx-auto max-w-md">
        {/* Navigasi Atas */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:text-zinc-900 transition-colors"
          >
            <HiOutlineArrowLeft size={16} /> Scan Kembali
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">
            E-Ticket Ready
          </span>
        </div>

        {/* AREA TIKET */}
        <div
          ref={ticketRef}
          id="ticket-download-area"
          style={{
            backgroundColor: "#121212",
            color: "#ffffff",
            borderRadius: "3rem",
            padding: "2.5rem 2rem",
            position: "relative",
            overflow: "hidden",
            marginBottom: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Ornamen Lubang Tiket Kiri & Kanan */}
          <div
            style={{
              backgroundColor: "#FAF9F5",
              position: "absolute",
              left: "-1.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "3rem",
              height: "3rem",
              borderRadius: "9999px",
            }}
          ></div>
          <div
            style={{
              backgroundColor: "#FAF9F5",
              position: "absolute",
              right: "-1.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "3rem",
              height: "3rem",
              borderRadius: "9999px",
            }}
          ></div>

          {/* Bagian Atas / Header Tiket */}
          <div
            className="text-center"
            style={{
              borderBottom: "2px dashed rgba(255,255,255,0.1)",
              paddingBottom: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div className="flex justify-center mb-4">
              <div
                style={{
                  backgroundColor: "#27272a",
                  padding: "1rem",
                  borderRadius: "1.5rem",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                }}
              >
                <HiOutlineTicket size={32} style={{ color: "#ffffff" }} />
              </div>
            </div>

            <p
              style={{
                color: "#22c55e",
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.4em",
                marginBottom: "0.5rem",
              }}
            >
              Confirmed Presence
            </p>

            <h2
              className="text-2xl font-black uppercase italic tracking-tighter leading-none"
              style={{ color: "#ffffff" }}
            >
              {data.event.nama_event}
            </h2>
          </div>

          {/* Bagian Tengah / Informasi */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.2rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#1f1f23",
                  padding: "0.5rem",
                  borderRadius: "0.75rem",
                }}
              >
                <HiOutlineUser style={{ color: "#71717a" }} size={18} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "8px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#52525b",
                    marginBottom: "4px",
                  }}
                >
                  Nama Peserta
                </p>
                <p
                  style={{
                    fontWeight: "800",
                    fontSize: "1.1rem",
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {data.participant.nama}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.2rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#1f1f23",
                  padding: "0.5rem",
                  borderRadius: "0.75rem",
                }}
              >
                <HiOutlineLocationMarker
                  style={{ color: "#71717a" }}
                  size={18}
                />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "8px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#52525b",
                    marginBottom: "4px",
                  }}
                >
                  Domisili / Alamat
                </p>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#a1a1aa",
                    fontWeight: "500",
                    lineHeight: "1.4",
                  }}
                >
                  {data.participant.alamat || "Alamat tidak dicantumkan"}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.2rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#1f1f23",
                  padding: "0.5rem",
                  borderRadius: "0.75rem",
                }}
              >
                <HiOutlineClock style={{ color: "#71717a" }} size={18} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "8px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#52525b",
                    marginBottom: "4px",
                  }}
                >
                  Token & Waktu Check-in
                </p>
                <p
                  style={{
                    fontWeight: "700",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  {data.ticket.token}{" "}
                  <span style={{ color: "#3f3f46", margin: "0 8px" }}>|</span>{" "}
                  {formatJam(data.ticket.jam_masuk)} WIB
                </p>
              </div>
            </div>
          </div>

          {/* Bagian Bawah / QR Code */}
          <div className="mt-10 flex flex-col items-center">
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "1.25rem",
                borderRadius: "2rem",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              }}
            >
              <img
                src={data.ticket.qr_image}
                alt="QR Verification"
                style={{
                  width: "8.5rem",
                  height: "8.5rem",
                  objectFit: "contain",
                }}
                crossOrigin="anonymous"
              />
            </div>
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "8px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.5em",
                color: "#3f3f46",
              }}
            >
              Authorized QR Code
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <button
          onClick={downloadTicket}
          className="w-full py-5 rounded-[2rem] bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <HiOutlineDownload size={20} /> Simpan Gambar Tiket
        </button>

        <p className="mt-8 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">
          Gunakan tiket ini sebagai bukti sah <br /> kehadiran di lokasi acara.
        </p>
      </div>
    </div>
  );
}
