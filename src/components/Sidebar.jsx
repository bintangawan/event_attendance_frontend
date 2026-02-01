import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineLogout,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineTicket,
  HiOutlinePhotograph, // Icon Baru
  HiMenuAlt2,
  HiX,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Untuk mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Untuk desktop collapse
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    toast.success("Logout Berhasil");
    navigate("/admin/login");
  };

  const menuItems = [
    {
      name: "All Events",
      path: "/admin/events",
      icon: <HiOutlineCalendar size={22} />,
    },
  ];

  const eventIdMatch = location.pathname.match(/\/events\/([^/]+)/);
  if (eventIdMatch) {
    const eventId = eventIdMatch[1];
    menuItems.push(
      {
        name: "Details & Gallery", // MENU BARU
        path: `/admin/events/${eventId}/details`,
        icon: <HiOutlinePhotograph size={22} />,
      },
      {
        name: "Attendance",
        path: `/admin/events/${eventId}/attendance`,
        icon: <HiOutlineUsers size={22} />,
      },
      {
        name: "Roulette",
        path: `/admin/events/${eventId}/roulette`,
        icon: <HiOutlineTicket size={22} />,
      },
      {
        name: "Winners",
        path: `/admin/events/${eventId}/lottery`,
        icon: <HiOutlineTicket size={22} />,
      }
    );
  }

  return (
    <>
      {/* Mobile Trigger Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#FAF9F5]/80 backdrop-blur-md border-b border-[#E5E4E0] flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#1A1A1A] text-white grid place-items-center font-bold text-xs">
            QR
          </div>
          <span className="font-bold text-sm tracking-tight">ADMIN</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-white border border-zinc-200 shadow-sm"
        >
          {isOpen ? <HiX size={24} /> : <HiMenuAlt2 size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed left-0 top-0 h-screen border-r border-[#E5E4E0] bg-[#FAF9F5]/90 backdrop-blur-xl flex flex-col z-50
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64 w-64"}
        `}
      >
        {/* Toggle Button Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 h-6 w-6 bg-white border border-[#E5E4E0] rounded-full items-center justify-center shadow-sm hover:bg-zinc-50 z-[60]"
        >
          {isCollapsed ? (
            <HiChevronRight size={14} />
          ) : (
            <HiChevronLeft size={14} />
          )}
        </button>

        <div className="p-6 border-b border-[#E5E4E0] bg-white/30 hidden lg:block overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[#1A1A1A] text-[#FAF9F5] grid place-items-center font-bold shadow-lg">
              QR
            </div>
            {!isCollapsed && (
              <span className="font-bold text-zinc-900 tracking-tight whitespace-nowrap transition-opacity duration-300">
                ADMIN PANEL
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-20 lg:mt-4 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              title={isCollapsed ? item.name : ""}
              className={`flex items-center transition-all duration-200 font-medium rounded-xl
                ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3 gap-3"}
                ${
                  location.pathname === item.path
                    ? "bg-[#1A1A1A] text-white shadow-md"
                    : "text-zinc-600 hover:bg-white"
                }`}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && (
                <span className="whitespace-nowrap overflow-hidden">
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E4E0] bg-white/30">
          <button
            onClick={logout}
            className={`flex items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all font-semibold text-sm
              ${isCollapsed ? "justify-center p-3 w-full" : "px-4 py-3 gap-3 w-full"}`}
          >
            <HiOutlineLogout size={18} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}