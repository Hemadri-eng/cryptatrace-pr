import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, FilePlus2, SearchCode, Waypoints,
  ShieldCheck, FileBarChart, Building2, Users, Settings, LogOut, ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const NAV_MAIN = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/cases", label: "Cases", icon: FolderOpen },
  { to: "/new-report", label: "New Report", icon: FilePlus2 },
  { to: "/intelligence", label: "Blockchain Intelligence", icon: Waypoints },
  { to: "/evidence", label: "Evidence", icon: ShieldCheck },
  { to: "/reports", label: "Reports", icon: FileBarChart },
];

const NAV_ADMIN = [
  { to: "/institution", label: "Institution", icon: Building2 },
  { to: "/users", label: "Users", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  const { user, institution, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavItems = ({ items }) => (
    <ul className="space-y-0.5">
      {items.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-ring ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 font-medium"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-ink-950 text-white flex items-center justify-between px-4 z-40">
        <button onClick={() => setMobileOpen(true)} className="text-sm font-semibold tracking-wide">
          ☰ CRYPTATRACE
        </button>
        <RiskShield />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-ink-950 text-white flex flex-col z-50 transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <RiskShield />
          <div>
            <div className="font-display font-semibold text-[15px] tracking-tight leading-none">CRYPTATRACE</div>
            <div className="text-[11px] text-slate-400 mt-0.5">solving transaction fraud</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavItems items={NAV_MAIN} />

          {(user?.role === "INSTITUTION_ADMIN" || user?.role === "SUPER_ADMIN") && (
            <>
              <div className="h-px bg-white/10 my-4" />
              <NavItems items={NAV_ADMIN} />
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="px-3 py-2 mb-1">
            <div className="text-sm font-medium truncate">{user?.full_name}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {institution?.name || "System Administrator"} &middot; {user?.role?.replace("_", " ")}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white focus-ring"
          >
            <LogOut size={17} strokeWidth={1.8} />
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function RiskShield() {
  return (
    <div className="w-8 h-8 rounded-md bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
      <ShieldAlert size={17} className="text-cyan-300" strokeWidth={2} />
    </div>
  );
}
