import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import api from "../api/api.js";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import {
  HiOutlineUserAdd,
  HiOutlineTicket,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineClock,
} from "react-icons/hi";

export default function AdminAddAttendances() {
  const { id } = useParams(); // eventId
  const ticketRef = useRef(null);

  const [form, setForm] = useState({ nama: "", no_hp: "", alamat: "" });
  const [ticket, setTicket] = useState(null); // Jika null form muncul, jika ada data ticket muncul
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState("Loading...");

  // 1. Ambil Nama Event untuk Header
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/api/events/${id}`);
        setEventName(res.data.nama_event);
      } catch (err) {
        console.error(err);
        toast.error("Gagal mengambil data event");
      }
    };
    fetchEvent();
  }, [id]);

  // 2. Handle Input Form
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // 3. Submit Form -> Create QR Manual
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.no_hp) {
      return toast.error("Nama dan No HP wajib diisi");
    }

    try {
      setLoading(true);
      const res = await api.post(`/api/attendance/${id}`, form);

      // Simpan data tiket dari response ke state untuk ditampilkan
      setTicket(res.data.ticket);
      toast.success(res.data.message);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal membuat tiket");
    } finally {
      setLoading(false);
    }
  };

  // 4. Download Ticket Logic (Sama persis dengan CheckinPage)
  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    const loadId = toast.loading("Mempersiapkan gambar...");
    try {
      // Pastikan font sudah loaded
      await document.fonts.ready;

      await new Promise((r) => setTimeout(r, 1200)); // Delay lebih lama untuk render font

      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        backgroundColor: "#FAF9F5",
        useCORS: true,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("checkin-ticket-area");
          if (el) {
            el.style.backgroundColor = "#121212";
            el.style.color = "#ffffff";
          }
        },
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `Tiket_${ticket.nama_peserta || "Peserta"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(loadId);
      toast.success("Tiket berhasil disimpan!");
    } catch (err) {
      console.error(err);
      toast.dismiss(loadId);
      toast.error("Gagal download tiket");
    }
  };

  // 5. Reset untuk tambah peserta baru
  const handleReset = () => {
    setTicket(null);
    setForm({ nama: "", no_hp: "", alamat: "" });
  };

  // Utility Formatter
  const formatJam = (isoString) => {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
          {/* Header */}
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                Registrasi Manual
              </h1>
              <p className="text-sm text-zinc-500 font-medium mt-1">
                Event:{" "}
                <span className="text-zinc-900 font-bold">{eventName}</span>
              </p>
            </div>
            <Link
              to={`/admin/events/${id}/attendance`} // Kembali ke detail event
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 transition-all shadow-sm w-fit"
            >
              <HiOutlineArrowLeft size={16} /> Kembali
            </Link>
          </header>

          <div className="max-w-2xl mx-auto">
            {!ticket ? (
              /* --- FORM INPUT --- */
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-100">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-50">
                  <div className="p-3 bg-zinc-900 text-white rounded-xl">
                    <HiOutlineUserAdd size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Data Peserta</h2>
                    <p className="text-xs text-zinc-400">
                      Masukkan data untuk membuat QR Code
                    </p>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="nama"
                      value={form.nama}
                      onChange={onChange}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none focus:border-zinc-900 focus:bg-white transition-all font-bold text-sm"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      No. WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="no_hp"
                      type="number"
                      value={form.no_hp}
                      onChange={onChange}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none focus:border-zinc-900 focus:bg-white transition-all font-bold text-sm"
                      placeholder="Contoh: 62812345678"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Alamat / Domisili
                    </label>
                    <textarea
                      name="alamat"
                      value={form.alamat}
                      onChange={onChange}
                      rows={3}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none focus:border-zinc-900 focus:bg-white transition-all font-bold text-sm resize-none"
                      placeholder="Alamat lengkap..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-4 rounded-2xl bg-zinc-900 text-white font-bold uppercase tracking-widest shadow-lg hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <HiOutlineTicket size={20} />
                    {loading ? "Memproses..." : "Generate Tiket & QR"}
                  </button>
                </form>
              </div>
            ) : (
              /* --- TICKET RESULT (DIPERBAIKI STYLING) --- */
              <div className="animate-in fade-in zoom-in-95 duration-300">
                {/* TIKET AREA (UNTUK DI-CAPTURE) */}
                <div
                  ref={ticketRef}
                  id="checkin-ticket-area"
                  style={{
                    backgroundColor: "#121212",
                    color: "#ffffff",
                    borderRadius: "2rem",
                    padding: "2rem",
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: "2rem",
                    fontFamily: "'Poppins', sans-serif",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    maxWidth: "420px",
                    margin: "0 auto 2rem auto",
                  }}
                >
                  {/* Ornamen Lubang Tiket */}
                  <div
                    style={{
                      backgroundColor: "#FAF9F5",
                      position: "absolute",
                      left: "-1.25rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "9999px",
                    }}
                  ></div>
                  <div
                    style={{
                      backgroundColor: "#FAF9F5",
                      position: "absolute",
                      right: "-1.25rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "9999px",
                    }}
                  ></div>

                  {/* Header Tiket */}
                  <div
                    style={{
                      textAlign: "center",
                      borderBottom: "1px dashed rgba(255,255,255,0.15)",
                      paddingBottom: "1.5rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        display: "inline-flex",
                        padding: "0.875rem",
                        borderRadius: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <HiOutlineTicket size={28} color="#ffffff" />
                    </div>
                    <h2
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        margin: "0 0 0.75rem 0",
                        color: "#ffffff",
                        fontFamily: "'Poppins', sans-serif",
                        lineHeight: "1.3",
                      }}
                    >
                      {eventName}
                    </h2>
                    <div
                      style={{
                        width: "90px",
                        height: "24px",
                        margin: "0 auto",
                        borderRadius: "9999px",
                        backgroundColor: "#22c55e",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontFamily: "'Poppins', sans-serif",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      VERIFIED
                    </div>
                  </div>

                  {/* Detail Peserta */}
                  <div
                    style={{
                      padding: "0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.25rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {/* Nama */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.875rem",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: "2px",
                        }}
                      >
                        <HiOutlineUser size={18} color="#ffffff" />
                      </div>
                      <div style={{ flex: "1" }}>
                        <p
                          style={{
                            color: "#71717a",
                            fontSize: "9px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            margin: "0 0 6px 0",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          NAMA PESERTA
                        </p>
                        <p
                          style={{
                            color: "#ffffff",
                            fontWeight: "700",
                            fontSize: "1rem",
                            textTransform: "uppercase",
                            margin: 0,
                            fontFamily: "'Poppins', sans-serif",
                            letterSpacing: "0.025em",
                            lineHeight: "1.3",
                          }}
                        >
                          {ticket.nama_peserta}
                        </p>
                      </div>
                    </div>

                    {/* Domisili */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.875rem",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: "2px",
                        }}
                      >
                        <HiOutlineLocationMarker size={18} color="#ffffff" />
                      </div>
                      <div style={{ flex: "1" }}>
                        <p
                          style={{
                            color: "#71717a",
                            fontSize: "9px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            margin: "0 0 6px 0",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          DOMISILI
                        </p>
                        <p
                          style={{
                            color: "#d4d4d8",
                            fontSize: "0.875rem",
                            margin: 0,
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: "500",
                            lineHeight: "1.4",
                          }}
                        >
                          {form.alamat || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Token */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.875rem",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: "2px",
                        }}
                      >
                        <HiOutlineClock size={18} color="#ffffff" />
                      </div>
                      <div style={{ flex: "1" }}>
                        <p
                          style={{
                            color: "#71717a",
                            fontSize: "9px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            margin: "0 0 6px 0",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          TOKEN & WAKTU
                        </p>
                        <p
                          style={{
                            color: "#ffffff",
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: "700",
                            fontSize: "0.9375rem",
                            margin: 0,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {ticket.token} • {formatJam(ticket.jam_masuk)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      borderTop: "1px dashed rgba(255,255,255,0.15)",
                      marginBottom: "1.5rem",
                    }}
                  ></div>

                  {/* QR Code */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "1rem",
                        borderRadius: "1.25rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <img
                        src={ticket.qr_image}
                        alt="QR"
                        style={{
                          width: "9rem",
                          height: "9rem",
                          objectFit: "contain",
                          display: "block",
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                    <p
                      style={{
                        color: "#52525b",
                        marginTop: "1rem",
                        fontSize: "9px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        margin: "1rem 0 0 0",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      SCAN FOR VALIDATION
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col gap-3 max-w-md mx-auto">
                  <button
                    onClick={downloadTicket}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
                  >
                    <HiOutlineDownload size={20} /> Download Tiket (PNG)
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white border-2 border-zinc-100 text-zinc-500 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95"
                  >
                    <HiOutlineRefresh size={20} /> Tambah Peserta Lain
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
