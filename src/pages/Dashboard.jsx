import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Bell, AlertTriangle, Map, Calendar, ChevronRight, BarChart3, Loader2 } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import PageHeader from '@/components/ui/PageHeader';
import MapView from '@/components/map/MapView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RisksChart, AlertsTimeline } from '@/components/dashboard/DashboardCharts';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  const { data: alertas = [], isLoading: loadingAlertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => {
      if (appParams.appId === 'demo-app-id') {
        return [
          { id: 'a1', titulo: 'Deforestación Crítica', territorio_nombre: 'Amazonas Sector A', nivel: 'alto', estado: 'activa', created_date: new Date().toISOString() },
          { id: 'a2', titulo: 'Construcción no autorizada', territorio_nombre: 'Reserva Norte', nivel: 'medio', estado: 'activa', created_date: new Date().toISOString() }
        ];
      }
      return base44.entities.Alerta.list('-created_date', 100);
    }
  });

  const { data: territorios = [], isLoading: loadingTerritorios } = useQuery({
    queryKey: ['territorios'],
    queryFn: () => {
      if (appParams.appId === 'demo-app-id') {
        return [
          { id: 'demo', nombre: 'Amazonas Sector A', activo: true, frecuencia: 'semanal', created_date: new Date().toISOString() },
          { id: 't2', nombre: 'Reserva Norte', activo: true, frecuencia: 'mensual', created_date: new Date().toISOString() }
        ];
      }
      return base44.entities.Territorio.list('-created_date', 100);
    }
  });

  const { data: hallazgos = [], isLoading: loadingHallazgos } = useQuery({
    queryKey: ['hallazgos'],
    queryFn: () => {
      if (appParams.appId === 'demo-app-id') {
        return [
          { id: 'h1', nombre: 'Punto de desmonte', territorio_nombre: 'Amazonas Sector A', nivel_riesgo: 'alto', revisado: false, created_date: new Date().toISOString() },
          { id: 'h2', nombre: 'Nueva estructura', territorio_nombre: 'Reserva Norte', nivel_riesgo: 'medio', revisado: false, created_date: new Date().toISOString() }
        ];
      }
      return base44.entities.Hallazgo.list('-created_date', 100);
    }
  });

  const { data: analisis = [], isLoading: loadingAnalisis } = useQuery({
    queryKey: ['analisis'],
    queryFn: () => {
      if (appParams.appId === 'demo-app-id') {
        return [
          { id: 'an1', territorio_nombre: 'Amazonas Sector A', estado: 'completado', created_date: new Date().toISOString() }
        ];
      }
      return base44.entities.Analisis.list('-created_date', 10);
    }
  });

  const alertasActivas = alertas.filter(a => a.estado === 'activa');

  const handleTerritorioClick = (territorio) => {
    navigate(createPageUrl('TerritorioDetalle') + `?id=${territorio.id}`);
  };

  const handleHallazgoClick = (hallazgo) => {
    navigate(createPageUrl('HallazgoDetalle') + `?id=${hallazgo.id}`);
  };

  if (loadingAlertas || loadingTerritorios || loadingHallazgos || loadingAnalisis) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      <div className="relative">
        <div className="noise-bg absolute inset-0 -m-6" />
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
          <div>
            <Badge className="mb-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 text-[10px] tracking-widest uppercase">
              Actualizado: {format(new Date(), 'HH:mm')}
            </Badge>
            <h1 className="text-5xl font-bold magazine-title gradient-text tracking-tighter">Control Center</h1>
            <p className="text-slate-500 font-medium max-w-md">Bienvenido de nuevo. Monitoreando {territorios.length} activos estratégicos globales.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="glass border-white/5 hover:bg-white/5 text-xs font-bold uppercase tracking-wider h-12 px-6">
              <Calendar className="mr-2 h-4 w-4" /> Reporte Global
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 text-xs font-bold uppercase tracking-wider h-12 px-6">
              <AlertTriangle className="mr-2 h-4 w-4" /> Nueva Alerta
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Territorios", value: territorios.length, icon: Map, trend: "+2" },
          { title: "Alertas Activas", value: alertasActivas.length, icon: Bell, color: "text-rose-500" },
          { title: "Hallazgos", value: hallazgos.length, icon: AlertTriangle, color: "text-amber-500" },
          { title: "Análisis", value: analisis.length, icon: BarChart3 }
        ].map((stat, i) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="glass premium-shadow border-white/5 overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon size={80} />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
                    <h3 className={`text-4xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</h3>
                  </div>
                  <div className="p-2 glass rounded-lg border-white/10">
                    <stat.icon size={20} className={stat.color || 'text-emerald-500'} />
                  </div>
                </div>
                {stat.trend && (
                  <p className="text-[10px] text-emerald-400 mt-4 font-bold tracking-wider">{stat.trend} VS MES ANTERIOR</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Risk Distribution - Main Cell */}
        <motion.div variants={itemVariants} className="lg:col-span-8">
          <Card className="glass premium-shadow h-full border-white/5 overflow-hidden">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 magazine-title">
                <AlertTriangle size={18} className="text-emerald-400" />
                Matriz de Riesgo Geoespacial
              </CardTitle>
              <Badge variant="outline" className="border-white/10 text-slate-400">Tiempo Real</Badge>
            </CardHeader>
            <CardContent className="pt-8">
              <RisksChart 
                data={[
                  { name: 'Alto', cantidad: hallazgos.filter(h => h.nivel_riesgo === 'alto').length, color: '#f43f5e' },
                  { name: 'Medio', cantidad: hallazgos.filter(h => h.nivel_riesgo === 'medio').length, color: '#f59e0b' },
                  { name: 'Bajo', cantidad: hallazgos.filter(h => h.nivel_riesgo === 'bajo').length, color: '#10b981' }
                ]} 
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications - Side Cell */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="glass premium-shadow h-full border-white/5 flex flex-col">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg flex items-center gap-2 magazine-title">
                <Bell size={18} className="text-rose-400" />
                Alertas Críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-6 space-y-4">
              {alertasActivas.map(alerta => (
                <div key={alerta.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={alerta.nivel === 'alto' ? 'bg-rose-500/20 text-rose-500 border-rose-500/20' : 'bg-amber-500/20 text-amber-500'}>
                      {alerta.nivel}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{format(new Date(alerta.created_date), 'HH:mm')}</span>
                  </div>
                  <p className="font-bold text-sm text-white mb-1 group-hover:text-emerald-400 transition-colors">{alerta.titulo}</p>
                  <p className="text-xs text-slate-500">{alerta.territorio_nombre}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Map Integration */}
      <motion.div variants={itemVariants}>
        <Card className="glass premium-shadow border-white/5 overflow-hidden">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg magazine-title">Vista Global de Hallazgos</CardTitle>
                <p className="text-xs text-slate-500">Perspectiva orbital activa con capas Sentinel-2</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-white/5 text-xs font-bold uppercase tracking-widest text-emerald-400"
                onClick={() => navigate(createPageUrl('Territorios'))}
              >
                Explorar todo <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative">
            <div className="h-[600px] w-full isolate">
              <MapView
                territorios={territorios}
                hallazgos={hallazgos}
                height="600px"
                onTerritorioClick={handleTerritorioClick}
                onHallazgoClick={handleHallazgoClick}
              />
              {/* Overlay HUD */}
              <div className="absolute top-6 left-6 z-[1000] space-y-3 pointer-events-none">
                <div className="glass p-4 rounded-2xl border-white/10 w-48 shadow-2xl">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Status Orbital</p>
                  <p className="text-sm font-bold text-white mb-2">Conexión Estable</p>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}