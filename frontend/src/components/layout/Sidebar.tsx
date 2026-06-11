import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Sparkles, 
  FileCheck, 
  Settings, 
  LogOut
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "staff"] },
    { name: "Leads CRM", path: "/crm", icon: Users, roles: ["admin", "staff"] },
    { name: "Morning Report", path: "/reports", icon: FileText, roles: ["admin", "staff"] },
    { name: "AI Audit Assistant", path: "/audit", icon: Sparkles, roles: ["admin", "staff"] },
    { name: "Document Automation", path: "/documents", icon: FileCheck, roles: ["admin", "staff"] },
    { name: "Settings", path: "/settings", icon: Settings, roles: ["admin", "staff"] },
  ];

  return (
    <aside className="w-64 bg-darkbg-800 border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-electric-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-electric-500/20 border border-white/10">
          <span className="text-white font-extrabold text-xs tracking-tighter">FE</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wider" title="FutureEdge Education Services">FutureEdge</h1>
          <p className="text-[9px] text-electric-400 font-semibold tracking-wider uppercase">Edu Services</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.roles && !item.roles.includes(user?.role || "")) return null;
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group ${
                isActive 
                  ? "bg-darkbg-700 text-white font-medium border-l-4 border-electric-500 pl-3" 
                  : "text-slate-400 hover:bg-darkbg-700/50 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${
                isActive ? "text-electric-500" : "text-slate-400 group-hover:text-slate-200"
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile Footer */}
      {user && (
        <div className="p-4 border-t border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.first_name} {user.last_name}</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};
