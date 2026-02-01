import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api.js";
import Sidebar from "../components/Sidebar.jsx";
import "../styles/roulette.css";

export default function LotteryRoulette() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [finalWinner, setFinalWinner] = useState(null);
  const [rotation, setRotation] = useState(0);

  // State baru untuk input hadiah
  const [hadiahInput, setHadiahInput] = useState("");

  const colors = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#03A9F4",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
    "#795548",
    "#9E9E9E",
  ];

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const evRes = await api.get(`/api/events/${id}`);
      setEvent(evRes.data);
      const attRes = await api.get(`/api/lottery/${id}/eligible`);
      setParticipants(attRes.data?.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Gagal memuat data peserta.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const spinWheel = async () => {
    // Validasi input hadiah
    if (!hadiahInput.trim()) {
      toast.error("Silakan masukkan jenis hadiah terlebih dahulu!");
      return;
    }

    if (spinning || participants.length === 0) return;
    setSpinning(true);
    setFinalWinner(null);

    try {
      const res = await api.post(`/api/lottery/${id}`, {
        jumlah_pemenang: 1,
        hadiah: hadiahInput, // Mengirimkan hadiah dari input
      });

      const winnerData = res.data.winners[0];
      const winnerIndex = participants.findIndex(
        (p) => Number(p.attendance_id) === Number(winnerData.attendance_id),
      );

      if (winnerIndex === -1) {
        toast.error("Data tidak sinkron.");
        setSpinning(false);
        return;
      }

      const numSegments = participants.length;
      const degreesPerSegment = 360 / numSegments;
      const extraRotations = 10 * 360;
      const targetOffset =
        360 - (winnerIndex * degreesPerSegment + degreesPerSegment / 2);
      const newRotation =
        rotation + extraRotations + (targetOffset - (rotation % 360));

      setRotation(newRotation);

      setTimeout(() => {
        setFinalWinner({
          nama: winnerData.nama,
          token: winnerData.ticket_token,
          hadiah: winnerData.hadiah,
        });
        setSpinning(false);
        setHadiahInput(""); // Reset input hadiah setelah menang
        fetchParticipants();
      }, 5000);
    } catch (err) {
      console.error("Spin Error:", err);
      toast.error("Gagal melakukan pengundian.");
      setSpinning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex text-zinc-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col relative h-screen transition-all duration-300">
        {/* HEADER */}
        <div className="w-full text-center pt-12 pb-4 z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900 leading-tight">
            {loading ? "MEMUAT..." : event?.nama_event}
          </h1>
          <p className="text-zinc-400 font-medium italic mt-1 uppercase text-[10px] tracking-[0.4em]">
            Lucky Draw Roulette
          </p>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex items-center justify-center relative px-20">
          {/* ROULETTE (TENGAH) */}
          <div className="relative flex items-center justify-center">
            <div className="wheel-glow-center"></div>
            <div className="wheel-container-main">
              <div className="pointer-top"></div>
              <div className="wheel-center-cap"></div>
              <div
                className="wheel"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {participants.map((p, index) => {
                  const degreesPerSegment = 360 / participants.length;
                  const startAngle = index * degreesPerSegment;
                  return (
                    <div
                      key={p.attendance_id}
                      className="wheel-slice"
                      style={{
                        background: `conic-gradient(transparent 0deg ${startAngle}deg, ${colors[index % colors.length]} ${startAngle}deg ${startAngle + degreesPerSegment}deg, transparent ${startAngle + degreesPerSegment}deg 360deg)`,
                      }}
                    >
                      <div
                        className="absolute top-1/2 left-1/2 w-1/2 text-right pr-8 origin-left font-black text-white text-[10px] md:text-sm"
                        style={{
                          transform: `rotate(${startAngle + degreesPerSegment / 2 - 90}deg)`,
                        }}
                      >
                        {p.ticket_token}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PANEL KONTROL (KANAN TENGAH) */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 w-72 z-20">
            {/* Box Status */}
            <div className="bg-white/50 border border-zinc-200 p-5 rounded-3xl backdrop-blur-md shadow-sm">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Peserta Ready
              </p>
              <p className="text-3xl font-black text-zinc-900">
                {participants.length}
              </p>
            </div>

            {/* Input Jenis Hadiah */}
            <div className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                Jenis Hadiah
              </label>
              <input
                type="text"
                placeholder="Contoh: Kulkas, Voucher..."
                value={hadiahInput}
                onChange={(e) => setHadiahInput(e.target.value)}
                disabled={spinning}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all disabled:opacity-50"
              />
            </div>

            <button
              onClick={spinWheel}
              disabled={spinning || loading || participants.length === 0}
              className="w-full py-8 rounded-3xl bg-[#1A1A1A] text-white font-black text-xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 tracking-[0.1em] uppercase leading-tight"
            >
              {spinning ? "BERPUTAR..." : "PUTAR\nSEKARANG"}
            </button>
          </div>
        </div>

        {/* MODAL PEMENANG */}
        <div
          className={`overlay-blur ${finalWinner ? "active" : ""}`}
          onClick={() => setFinalWinner(null)}
        />
        <div className={`winner-display ${finalWinner ? "active" : ""}`}>
          <div className="text-5xl mb-4 text-center">🏆</div>
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] text-center">
            Selamat Kepada
          </h2>
          <div className="text-3xl font-black text-zinc-900 mt-2 mb-1 text-center">
            {finalWinner?.nama}
          </div>
          <div className="flex justify-center flex-col items-center">
            <div className="px-3 py-1 bg-zinc-100 rounded-lg font-mono text-zinc-500 font-bold mb-2 border border-zinc-200 uppercase tracking-tighter">
              {finalWinner?.token}
            </div>
            <div className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
              Mendapatkan: {finalWinner?.hadiah}
            </div>
          </div>
          <button
            onClick={() => setFinalWinner(null)}
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors hover:bg-zinc-800"
          >
            Tutup
          </button>
        </div>
      </main>
    </div>
  );
}
