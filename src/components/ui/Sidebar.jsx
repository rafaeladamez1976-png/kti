import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  Search, 
  FileText, 
  Bell, 
  Settings, 
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Territorios', icon: Map, page: 'Territorios' },
  { name: 'Análisis', icon: BarChart3, page: 'Analisis' },
  { name: 'Hallazgos', icon: Search, page: 'Hallazgos' },
  { name: 'Informes', icon: FileText, page: 'Informes' },
  { name: 'Alertas', icon: Bell, page: 'Alertas' },
  { name: 'Configuración', icon: Settings, page: 'Configuracion' },
  { name: 'Ayuda', icon: HelpCircle, page: 'Ayuda' },
];

export default function Sidebar({ collapsed, setCollapsed, user }) {
  const location = useLocation();
  
  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const isActive = (page) => {
    return location.pathname.includes(page);
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold">
              K
            </div>
            <span className="font-semibold text-lg">KTI</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold mx-auto">
            K
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 hover:bg-slate-700 rounded transition-colors",
            collapsed && "absolute -right-3 top-5 bg-slate-900 border border-slate-700"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.page}>
              <Link
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive(item.page) 
                    ? "bg-emerald-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-slate-700 p-4">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role || 'usuario'}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg w-full text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}