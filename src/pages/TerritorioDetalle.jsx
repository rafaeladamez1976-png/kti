import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Map, BarChart3, Calendar, Play, Pause, Pencil, Trash2, Image } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MapView from '@/components/map/MapView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SatelliteComparison from '@/components/map/SatelliteComparison';

export default function TerritorioDetalle({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const territorioId = urlParams.get('id');

  const [deleteDialog, setDeleteDialog] = useState(false);

  const { data: territorio, isLoading } = useQuery({
    queryKey: ['territorio', territorioId],
    queryFn: async () => {
      if (territorioId === 'demo' || appParams.appId === 'demo-app-id') {
        return {
          id: 'demo',
          nombre: 'Territorio de Prueba (Amazonas)',
          frecuencia: 'semanal',
          activo: true,
          tipo_riesgo: 'deforestacion',
          cliente: 'EcoMonitor Inc.',
          centro_lat: -3.4653,
          centro_lng: -62.2159,
          created_date: new Date().toISOString()
        };
      }
      const list = await base44.entities.Territorio.filter({ id: territorioId });
      return list[0];
    },
    enabled: !!territorioId
  });

  const { data: analisis = [] } = useQuery({
    queryKey: ['analisis', territorioId],
    queryFn: () => {
      if (territorioId === 'demo' || appParams.appId === 'demo-app-id') {
        return [{
          id: 'demo-analysis',
          territorio_id: 'demo',
          fecha_imagen_a: '2024-01-01',
          fecha_imagen_b: '2024-03-01',
          tipo: 'manual',
          estado: 'completado',
          cambios_detectados: 3,
          created_date: new Date().toISOString()
        }];
      }
      return base44.entities.Analisis.filter({ territorio_id: territorioId }, '-created_date', 50);
    },
    enabled: !!territorioId
  });

  const { data: hallazgos = [] } = useQuery({
    queryKey: ['hallazgos', territorioId],
    queryFn: () => {
      if (territorioId === 'demo' || appParams.appId === 'demo-app-id') {
        return [
          { id: 'h1', nombre: 'Desmonte detectado', nivel_riesgo: 'alto', latitud: -3.465, longitud: -62.215, tipo_cambio: 'deforestacion' },
          { id: 'h2', nombre: 'Nueva vía secundaria', nivel_riesgo: 'medio', latitud: -3.466, longitud: -62.216, tipo_cambio: 'infraestructura' }
        ];
      }
      return base44.entities.Hallazgo.filter({ territorio_id: territorioId }, '-created_date', 50);
    },
    enabled: !!territorioId
  });

  const { data: imagenes = [] } = useQuery({
    queryKey: ['imagenes', territorioId],
    queryFn: () => {
      if (territorioId === 'demo' || appParams.appId === 'demo-app-id') {
        return [
          { id: 'img1', tipo: 'Sentinel-2', fecha: '2024-01-01', cobertura_nubes: 5 },
          { id: 'img2', tipo: 'Sentinel-2', fecha: '2024-03-01', cobertura_nubes: 2 }
        ];
      }
      return base44.entities.ImagenSatelital.filter({ territorio_id: territorioId }, '-fecha', 50);
    },
    enabled: !!territorioId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Territorio.update(territorioId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['territorio', territorioId] })
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Territorio.delete(territorioId),
    onSuccess: () => navigate(createPageUrl('Territorios'))
  });

  if (!territorioId) {
    navigate(createPageUrl('Territorios'));
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!territorio) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Territorio no encontrado</p>
        <Button onClick={() => navigate(createPageUrl('Territorios'))} className="mt-4">
          Volver a territorios
        </Button>
      </div>
    );
  }

  const frecuenciaLabels = {
    semanal: 'Semanal',
    quincenal: 'Quincenal',
    mensual: 'Mensual'
  };

  const tipoRiesgoLabels = {
    deforestacion: 'Deforestación',
    construccion_ilegal: 'Construcción ilegal',
    mineria: 'Minería',
    invasion: 'Invasión',
    otro: 'Otro'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Territorios'))}>
          <ArrowLeft size={20} />
        </Button>
        <PageHeader 
          title={territorio.nombre}
          description={`Frecuencia: ${frecuenciaLabels[territorio.frecuencia] || territorio.frecuencia}`}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => updateMutation.mutate({ activo: !territorio.activo })}
                className="gap-2"
              >
                {territorio.activo ? <Pause size={16} /> : <Play size={16} />}
                {territorio.activo ? 'Pausar' : 'Activar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('EjecutarAnalisis') + `?territorio_id=${territorio.id}`)}
                className="gap-2"
              >
                <BarChart3 size={16} />
                Ejecutar análisis
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 size={16} />
                Eliminar
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        {/* Map & Comparison */}
        <div className="lg:col-span-2 space-y-6">
          {analisis.length > 0 && (
            <SatelliteComparison 
              beforeImg="/before.png"
              afterImg="/after.png"
              beforeDate={analisis[0].fecha_imagen_a ? format(new Date(analisis[0].fecha_imagen_a), 'dd/MM/yyyy') : 'N/A'}
              afterDate={analisis[0].fecha_imagen_b ? format(new Date(analisis[0].fecha_imagen_b), 'dd/MM/yyyy') : 'N/A'}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map size={18} />
                Área del territorio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapView
                territorios={[territorio]}
                hallazgos={hallazgos}
                center={territorio.centro_lat && territorio.centro_lng ? [territorio.centro_lat, territorio.centro_lng] : undefined}
                zoom={12}
                height="400px"
                onHallazgoClick={(h) => navigate(createPageUrl('HallazgoDetalle') + `?id=${h.id}`)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Estado</p>
                <Badge variant={territorio.activo ? "default" : "secondary"} className={territorio.activo ? "bg-emerald-100 text-emerald-700" : ""}>
                  {territorio.activo ? 'Monitoreo activo' : 'Monitoreo pausado'}
                </Badge>
              </div>
              
              {territorio.tipo_riesgo && (
                <div>
                  <p className="text-sm text-slate-500">Tipo de riesgo</p>
                  <p className="font-medium">{tipoRiesgoLabels[territorio.tipo_riesgo] || territorio.tipo_riesgo}</p>
                </div>
              )}

              {territorio.cliente && (
                <div>
                  <p className="text-sm text-slate-500">Cliente</p>
                  <p className="font-medium">{territorio.cliente}</p>
                </div>
              )}

              {territorio.ultimo_analisis && (
                <div>
                  <p className="text-sm text-slate-500">Último análisis</p>
                  <p className="font-medium">{format(new Date(territorio.ultimo_analisis), 'dd MMMM yyyy', { locale: es })}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500">Creado</p>
                <p className="font-medium">{format(new Date(territorio.created_date), 'dd MMMM yyyy', { locale: es })}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Análisis realizados</span>
                <span className="font-semibold">{analisis.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hallazgos totales</span>
                <span className="font-semibold">{hallazgos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Imágenes satelitales</span>
                <span className="font-semibold">{imagenes.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analisis">
        <TabsList>
          <TabsTrigger value="analisis">Análisis ({analisis.length})</TabsTrigger>
          <TabsTrigger value="hallazgos">Hallazgos ({hallazgos.length})</TabsTrigger>
          <TabsTrigger value="imagenes">Imágenes ({imagenes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analisis" className="mt-4">
          {analisis.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay análisis registrados para este territorio</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {analisis.map((a) => (
                <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('AnalisisDetalle') + `?id=${a.id}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {a.fecha_imagen_a && a.fecha_imagen_b 
                          ? `${format(new Date(a.fecha_imagen_a), 'dd/MM/yyyy')} → ${format(new Date(a.fecha_imagen_b), 'dd/MM/yyyy')}`
                          : 'Fechas no definidas'
                        }
                      </p>
                      <p className="text-sm text-slate-500 capitalize">{a.tipo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.cambios_detectados !== undefined && (
                        <span className="text-sm text-slate-500">{a.cambios_detectados} cambios</span>
                      )}
                      <Badge variant={a.estado === 'completado' ? 'default' : a.estado === 'error' ? 'destructive' : 'secondary'}>
                        {a.estado}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hallazgos" className="mt-4">
          {hallazgos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                <Map className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay hallazgos registrados para este territorio</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {hallazgos.map((h) => (
                <Card key={h.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('HallazgoDetalle') + `?id=${h.id}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{h.nombre}</p>
                      <p className="text-sm text-slate-500">{h.tipo_cambio?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.revisado && <Badge variant="secondary">Revisado</Badge>}
                      <Badge 
                        className={
                          h.nivel_riesgo === 'alto' ? 'bg-red-100 text-red-700' :
                          h.nivel_riesgo === 'medio' ? 'bg-amber-100 text-amber-700' : 
                          'bg-green-100 text-green-700'
                        }
                      >
                        {h.nivel_riesgo}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="imagenes" className="mt-4">
          {imagenes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay imágenes satelitales registradas para este territorio</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {imagenes.map((img) => (
                <Card key={img.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{img.tipo}</p>
                      <p className="text-sm text-slate-500">{format(new Date(img.fecha), 'dd MMMM yyyy', { locale: es })}</p>
                    </div>
                    {img.cobertura_nubes !== undefined && (
                      <span className="text-sm text-slate-500">Nubes: {img.cobertura_nubes}%</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar territorio"
        description={`¿Está seguro de eliminar el territorio "${territorio.nombre}"? Esta acción eliminará también todos los análisis, hallazgos e informes asociados.`}
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}