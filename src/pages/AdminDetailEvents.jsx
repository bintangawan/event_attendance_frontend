import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import toast from "react-hot-toast";
import api from "../api/api.js";
import {
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineCloudUpload,
  HiOutlineSave,
  HiX, // Icon Close untuk preview
} from "react-icons/hi";

export default function AdminDetailEvents() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Ref untuk input file (Fix bug document.getElementById null)
  const fileInputRef = useRef(null);

  const [event, setEvent] = useState(null);
  const [description, setDescription] = useState("");
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Upload
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // URL Preview Gambar

  const fetchEventData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Ambil Data Event Dasar
      const resEvent = await api.get(`/api/events/${id}`);
      setEvent(resEvent.data);
      setDescription(resEvent.data.description || "");

      // 2. Ambil Data Gallery (Gunakan endpoint spesifik ID)
      // Pastikan route ini sudah ada di backend: router.get("/:eventId/gallery", getEventGallery);
      try {
        const resGallery = await api.get(`/api/eventdetails/${id}/gallery`);
        setGallery(resGallery.data.data || []);
      } catch (err) {
        console.error("Gagal ambil gallery, mungkin endpoint belum dipasang?", err);
      }

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat detail event");
      if (err?.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // --- HANDLERS ---

  const handleUpdateDescription = async () => {
    try {
      await api.put(`/api/eventdetails/${id}/description`, { description });
      toast.success("Deskripsi berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal update deskripsi");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Buat URL Preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    // Reset input file menggunakan ref
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Pilih gambar terlebih dahulu");

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("caption", caption);

    try {
      setUploading(true);
      const res = await api.post(`/api/eventdetails/${id}/gallery`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success("Gambar berhasil diupload");
      
      // Tambahkan gambar baru ke state gallery (paling atas)
      const newImage = {
        id: res.data.data.gallery_id,
        src: res.data.data.full_url, // Pastikan backend kirim ini
        caption: res.data.data.caption
      };
      
      setGallery((prev) => [newImage, ...prev]);
      
      // Reset form
      clearSelectedFile();

    } catch (err) {
      console.error(err);
      toast.error("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (galleryId) => {
    if(!window.confirm("Yakin ingin menghapus gambar ini?")) return;

    try {
      await api.delete(`/api/eventdetails/gallery/${galleryId}`);
      setGallery((prev) => prev.filter((img) => img.id !== galleryId));
      toast.success("Gambar dihapus");
    } catch (err) {
      toast.error("Gagal menghapus gambar");
    }
  };

  // Cleanup object URL untuk memory leak saat component unmount atau preview berubah
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex text-zinc-900 font-sans">
      <Sidebar />

      <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 overflow-x-hidden">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {event?.event_code}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${event?.status_event === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
              {event?.status_event}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 uppercase leading-none">
            {event?.nama_event}
          </h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Atur deskripsi halaman depan dan galeri dokumentasi event.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          
          {/* KOLOM KIRI: Deskripsi */}
          <section className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-zinc-100 rounded-xl">
                <HiOutlineDocumentText size={20} className="text-zinc-600" />
              </div>
              <h2 className="font-bold text-lg">Deskripsi Event</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest ml-1 block mb-2">
                  Konten Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] transition-all resize-none leading-relaxed"
                  placeholder="Tuliskan deskripsi menarik tentang event ini..."
                />
              </div>
              
              <button 
                onClick={handleUpdateDescription}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1A1A1A] text-white text-sm font-bold shadow-lg hover:bg-zinc-800 active:scale-95 transition-all"
              >
                <HiOutlineSave size={18} />
                Simpan Deskripsi
              </button>
            </div>
          </section>

          {/* KOLOM KANAN: Form Upload */}
          <section className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-zinc-100 rounded-xl">
                <HiOutlineCloudUpload size={20} className="text-zinc-600" />
              </div>
              <h2 className="font-bold text-lg">Upload Gallery</h2>
            </div>

            <form onSubmit={handleUploadGallery} className="space-y-4">
              
              {/* AREA DROPZONE / PREVIEW */}
              {!previewUrl ? (
                <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center hover:bg-zinc-50 transition-colors relative group cursor-pointer">
                  <input
                    ref={fileInputRef} // Menggunakan Ref
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-3 pointer-events-none group-hover:scale-105 transition-transform">
                    <div className="p-3 bg-zinc-100 rounded-full text-zinc-400">
                        <HiOutlinePhotograph size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-600">Klik untuk pilih gambar</p>
                        <p className="text-xs text-zinc-400 mt-1">Format: JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-video">
                    <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                    />
                    <button 
                        type="button"
                        onClick={clearSelectedFile}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                        <HiX size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                        <p className="text-xs text-white truncate px-1">{selectedFile?.name}</p>
                    </div>
                </div>
              )}

              {/* CAPTION INPUT */}
              <div>
                 <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest ml-1 block mb-2">
                  Caption (Opsional)
                </label>
                 <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Contoh: Suasana Registrasi Peserta..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1A1A1A] transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-3 rounded-xl bg-blue-600 border border-blue-500 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
              >
                {uploading ? "Mengupload..." : "Upload Gambar"}
              </button>
            </form>
          </section>
        </div>

        {/* SECTION BAWAH: HISTORY GALLERY */}
        <section className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-zinc-100 rounded-xl">
                        <HiOutlinePhotograph size={20} className="text-zinc-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-zinc-900">History Gallery</h2>
                        <p className="text-xs text-zinc-400 font-medium">Total: {gallery.length} Foto</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {gallery.length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Belum ada foto</p>
                  <p className="text-xs text-zinc-400 mt-1">Upload foto dokumentasi event di form atas.</p>
                </div>
              ) : (
                gallery.map((img) => (
                  <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                    <img 
                      src={img.src} 
                      alt={img.caption} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Overlay Info & Delete */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-[10px] text-white font-bold truncate mb-2 drop-shadow-md">
                        {img.caption || "-"}
                      </p>
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-red-500/90 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-red-600 backdrop-blur-sm transition-all shadow-lg active:scale-95"
                      >
                        <HiOutlineTrash size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
        </section>

      </main>
    </div>
  );
}