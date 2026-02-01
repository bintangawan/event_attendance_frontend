import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api.js";
import html2canvas from "html2canvas";
import {
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineArrowLeft,
  HiOutlineTicket,
  HiOutlineDownload,
  HiOutlineUser,
  HiOutlineClock,
} from "react-icons/hi";

export default function CheckinPage() {
  const { eventCode } = useParams();
  const ticketRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [eventInfo, setEventInfo] = useState(null);
  const [form, setForm] = useState({ nama: "", no_hp: "", alamat: "" });
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState(null);

  const isOpen = useMemo(() => {
    if (!eventInfo) return false;
    return Boolean(eventInfo?.is_checkin_open);
  }, [eventInfo]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/checkin/${eventCode.toUpperCase()}`);
        if (res.data.event) {
          setEventInfo(res.data.event);
          document.title = `Check-in: ${res.data.event.nama_event}`;
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Gagal memuat info event");
        setEventInfo(null);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      document.title = "Event Attendance";
    };
  }, [eventCode]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.no_hp) {
      toast.error("Nama dan No HP wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nama: form.nama.trim(),
        no_hp: form.no_hp.replace(/\s+/g, ""),
        alamat: form.alamat.trim(),
      };

      const res = await api.post(
        `/api/attendance/checkin/${eventCode.toUpperCase()}`,
        payload,
      );
      setTicket(res.data.ticket);
      toast.success("Check-in berhasil!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Check-in gagal");
    } finally {
      setSubmitting(false);
    }
  };

  const formatJam = (isoString) => {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    const loadId = toast.loading("Mempersiapkan gambar...");
    try {
      // Delay agar render layout stabil
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // High Resolution
        backgroundColor: "#FAF9F5",
        useCORS: true,
        logging: false,
        // Fungsi onclone untuk memastikan styling aman dari oklch saat di-capture
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("checkin-ticket-area");
          if (el) {
            // Paksa reset ke HEX solid
            el.style.backgroundColor = "#121212";
            el.style.color = "#ffffff";
          }
        },
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `Tiket_${form.nama || "Event"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(loadId);
      toast.success("Tersimpan!");
    } catch (err) {
      console.error(err);
      toast.dismiss(loadId);
      toast.error("Gagal download. Gunakan Screenshot manual.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-zinc-900 font-sans pb-10 tracking-tight">
      <div className="mx-auto max-w-lg px-6 pt-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-tight">
              Event <br /> Check-in
            </h1>
            <div className="h-1.5 w-12 bg-zinc-900 mt-2 rounded-full"></div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <HiOutlineArrowLeft size={16} /> Scan Ulang
          </Link>
        </div>

        {!ticket ? (
          <>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-white shadow-2xl p-8 mb-8">
              {loading ? (
                <div className="animate-pulse space-y-4 py-4">
                  <div className="h-6 bg-zinc-100 rounded-full w-3/4"></div>
                  <div className="h-4 bg-zinc-50 rounded-full w-1/2"></div>
                </div>
              ) : !eventInfo ? (
                <div className="text-center py-10">
                  <p className="text-sm font-black text-red-500 uppercase tracking-widest">
                    Event Tidak Ditemukan
                  </p>
                </div>
              ) : (
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-green-50 text-green-700 border-green-100">
                      ● {eventInfo.status_event}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isOpen ? "text-blue-600 bg-blue-50 border-blue-100" : "text-red-500 bg-red-50 border-red-100"}`}
                    >
                      {isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-tight mb-6">
                    {eventInfo.nama_event}
                  </h2>
                  <div className="flex items-center gap-4 text-zinc-500 border-t border-zinc-50 pt-6">
                    <HiOutlineCalendar size={18} />
                    <span className="text-xs font-bold uppercase">
                      {formatDate(eventInfo.tanggal_event)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2 px-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Nama Lengkap
                </label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={onChange}
                  className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-4 outline-none focus:border-zinc-900 shadow-sm font-bold text-sm"
                  placeholder="CONTOH: BUDI SANTOSO"
                />
              </div>
              <div className="space-y-2 px-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  No. WhatsApp
                </label>
                <input
                  name="no_hp"
                  type="tel"
                  value={form.no_hp}
                  onChange={onChange}
                  className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-4 outline-none focus:border-zinc-900 shadow-sm font-bold text-sm"
                  placeholder="62812XXXXXXX"
                />
              </div>
              <div className="space-y-2 px-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={onChange}
                  rows={3}
                  className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-4 outline-none focus:border-zinc-900 shadow-sm font-bold text-sm resize-none"
                  placeholder="ALAMAT LENGKAP"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || loading || !isOpen}
                className="w-full rounded-2xl bg-zinc-900 py-5 font-black uppercase tracking-widest text-white shadow-2xl active:scale-[0.97] disabled:opacity-20 text-xs"
              >
                {submitting ? "Memproses..." : "Konfirmasi Kehadiran"}
              </button>
            </form>
          </>
        ) : (
          /* TAMPILAN TIKET: FULL INLINE STYLE HEX (NO TAILWIND COLORS) */
          <div className="animate-in zoom-in-95 duration-500">
            <div
              ref={ticketRef}
              id="checkin-ticket-area"
              style={{
                backgroundColor: "#121212",
                color: "#ffffff",
                borderRadius: "3.5rem",
                padding: "2rem",
                position: "relative",
                overflow: "hidden",
                marginBottom: "2rem",
                fontFamily: "sans-serif",
              }}
            >
              {/* Ornamen Lubang Tiket */}
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

              {/* Header Tiket */}
              <div
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    display: "inline-flex",
                    padding: "1rem",
                    borderRadius: "1.5rem",
                    marginBottom: "1rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <HiOutlineTicket size={32} style={{ color: "#ffffff" }} />
                </div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "-0.05em",
                    fontStyle: "italic",
                    margin: "0 0 0.5rem 0",
                    color: "#ffffff",
                  }}
                >
                  {eventInfo.nama_event}
                </h2>
                <div
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    backgroundColor: "#22c55e",
                    color: "#ffffff",
                    fontSize: "9px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Confirmed Presence
                </div>
              </div>

              {/* Detail Tiket */}
              <div
                style={{
                  padding: "2rem 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {/* Nama */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <HiOutlineUser
                    size={18}
                    style={{ color: "#71717a", marginTop: "4px" }}
                  />
                  <div>
                    <p
                      style={{
                        color: "#71717a",
                        fontSize: "8px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        margin: "0 0 2px 0",
                      }}
                    >
                      Nama Peserta
                    </p>
                    <p
                      style={{
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "1rem",
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      {form.nama}
                    </p>
                  </div>
                </div>

                {/* Alamat */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <HiOutlineLocationMarker
                    size={18}
                    style={{ color: "#71717a", marginTop: "4px" }}
                  />
                  <div>
                    <p
                      style={{
                        color: "#71717a",
                        fontSize: "8px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        margin: "0 0 2px 0",
                      }}
                    >
                      Domisili
                    </p>
                    <p
                      style={{
                        color: "#d4d4d8",
                        fontSize: "0.75rem",
                        lineHeight: "1.25",
                        margin: 0,
                      }}
                    >
                      {form.alamat || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Token & Jam */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <HiOutlineClock size={18} style={{ color: "#71717a" }} />
                  <div>
                    <p
                      style={{
                        color: "#71717a",
                        fontSize: "8px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        margin: "0 0 2px 0",
                      }}
                    >
                      Token & Jam Masuk
                    </p>
                    <p
                      style={{
                        color: "#ffffff",
                        fontFamily: "monospace",
                        fontWeight: "700",
                        fontSize: "0.875rem",
                        margin: 0,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {ticket.token} • {formatJam(ticket.jam_masuk)} WIB
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "1.25rem",
                    borderRadius: "2.5rem",
                  }}
                >
                  <img
                    src={ticket.qr_image}
                    alt="QR"
                    style={{
                      width: "9rem",
                      height: "9rem",
                      objectFit: "contain",
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
                <p
                  style={{
                    color: "#52525b",
                    marginTop: "1rem",
                    fontSize: "8px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.5em",
                    margin: "1rem 0 0 0",
                  }}
                >
                  Event System Ticket
                </p>
              </div>
            </div>

            <div className="space-y-4 px-2">
              <button
                onClick={downloadTicket}
                className="flex items-center justify-center gap-3 w-full py-5 rounded-[2rem] bg-zinc-900 text-white font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                <HiOutlineDownload size={20} /> Simpan Gambar Tiket
              </button>
              <Link
                to="/"
                className="block w-full py-5 rounded-[2rem] bg-white border border-zinc-200 text-center font-black text-xs uppercase tracking-widest text-zinc-400 shadow-sm"
              >
                Selesai
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
