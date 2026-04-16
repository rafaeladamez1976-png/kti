import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import Sidebar from '@/components/ui/Sidebar';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth && appParams.appId !== 'demo-app-id') {
          base44.auth.redirectToLogin();
          return;
        }
        
        const currentUser = appParams.appId === 'demo-app-id' ? {
          id: 'demo-user',
          full_name: 'Usuario Demo',
          email: 'demo@base44.app',
          role: 'admin',
          activo: true
        } : await base44.auth.me();
        
        // Check if user is active
        if (currentUser.activo === false) {
          await base44.auth.logout();
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        user={user}
      />
      
      <main 
        className={cn(
          "transition-all duration-300 min-h-screen",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6">
          {React.cloneElement(children, { user })}
        </div>
      </main>
    </div>
  );
}