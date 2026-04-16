import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { ArrowLeft, BarChart3, Map, Calendar, Trash2, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MapView from '@/components/map/MapView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SatelliteComparison from '@/components/map/SatelliteComparison';

export default function AnalisisDetalle({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const analisisId = urlParams.get('id');

  const [deleteDialog, setDeleteDialog] = useState(false);

  const { data: analisis, isLoading } = useQuery({
    queryKey: ['analisis', analisisId],
    queryFn: async () => {
      const list = await base44.entities.Analisis.filter({ id: analisisId });
      return list[0];
    },
    enabled: !!analisisId
  });

  const { data: hallazgos = [] } = useQuery({
    queryKey: ['hallazgos-analisis', analisisId],
    queryFn: () => base44.entities.Hallazgo.filter({ analisis_id: analisisId }, '-created_date', 50),
    enabled: !!analisisId
  });

  const { data: territorio } = useQuery({
    queryKey: ['territorio', analisis?.territorio_id],
    queryFn: async () => {
      if (!analisis?.territorio_id) return null;
      const list = await base44.entities.Territorio.filter({ id: analisis.territorio_id });
      return list[0];
    },
    enabled: !!analisis?.territorio_id
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Analisis.delete(analisisId),
    onSuccess: () => navigate(createPageUrl('Analisis'))
  });

  if (!analisisId) {
    navigate(createPageUrl('Analisis'));
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!analisis) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Análisis no encontrado</p>
        <Button onClick={() => navigate(createPageUrl('Analisis'))} className="mt-4">
          Volver a análisis
        </Button>
      </div>
    );
  }

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="text-emerald-500" />;
      case 'error':
        return <XCircle className="text-red-500" />;
      case 'procesando':
        return <Loader2 className="text-blue-500 animate-spin" />;
      default:
        return <Clock className="text-slate-400" />;
    }
  };

  const riesgosAltos = hallazgos.filter(h => h.nivel_riesgo === 'alto').length;
  const riesgosMedios = hallazgos.filter(h => h.nivel_riesgo === 'medio').length;
  const riesgosBajos = hallazgos.filter(h => h.nivel_riesgo === 'bajo').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Analisis'))}>
          <ArrowLeft size={20} />
        </Button>
        <PageHeader 
          title={`Análisis: ${analisis.territorio_nombre || 'Sin territorio'}`}
          description={analisis.fecha_imagen_a && analisis.fecha_imagen_b 
            ? `${format(new Date(analisis.fecha_imagen_a), 'dd/MM/yyyy')} → ${format(new Date(analisis.fecha_imagen_b), 'dd/MM/yyyy')}`
            : 'Fechas no definidas'
          }
          actions={
            <Button
              variant="destructive"
              onClick={() => setDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 size={16} />
              Eliminar
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(analisis.estado)}
              Estado del análisis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Estado</p>
              <Badge 
                className={
                  analisis.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                  analisis.estado === 'error' ? 'bg-red-100 text-red-700' :
                  analisis.estado === 'procesando' ? 'bg-blue-100 text-blue-700' :
                  ''
                }
              >
                {analisis.estado?.charAt(0).toUpperCase() + analisis.estado?.slice(1)}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-slate-500">Tipo</p>
              <p className="font-medium capitalize">{analisis.tipo}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Ejecutado</p>
              <p className="font-medium">{format(new Date(analisis.created_date), 'dd MMMM yyyy, HH:mm', { locale: es })}</p>
            </div>

            {analisis.ejecutado_por && (
              <div>
                <p className="text-sm text-slate-500">Por</p>
                <p className="font-medium">{analisis.ejecutado_por}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-slate-900">{analisis.cambios_detectados || 0}</p>
              <p className="text-slate-500">Cambios detectados</p>
            </div>

            {hallazgos.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Riesgo alto
                  </span>
                  <span className="font-medium">{riesgosAltos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Riesgo medio
                  </span>
                  <span className="font-medium">{riesgosMedios}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Riesgo bajo
                  </span>
                  <span className="font-medium">{riesgosBajos}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Período analizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Imagen "Antes"</p>
              <p className="font-medium">
                {analisis.fecha_imagen_a 
                  ? format(new Date(analisis.fecha_imagen_a), 'dd MMMM yyyy', { locale: es })
                  : 'No definida'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Imagen "Después"</p>
              <p className="font-medium">
                {analisis.fecha_imagen_b 
                  ? format(new Date(analisis.fecha_imagen_b), 'dd MMMM yyyy', { locale: es })
                  : 'No definida'
                }
              </p>
            </div>
            {territorio && (
              <div className="border-t pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(createPageUrl('TerritorioDetalle') + `?id=${territorio.id}`)}
                >
                  <Map size={16} className="mr-2" />
                  Ver territorio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Satellite Comparison */}
      {analisis.estado === 'completado' && (
        <SatelliteComparison 
          beforeImg="/before.png"
          afterImg="/after.png"
          beforeDate={analisis.fecha_imagen_a ? format(new Date(analisis.fecha_imagen_a), 'dd/MM/yyyy') : 'N/A'}
          afterDate={analisis.fecha_imagen_b ? format(new Date(analisis.fecha_imagen_b), 'dd/MM/yyyy') : 'N/A'}
        />
      )}

      {/* Summary */}
      {analisis.resumen && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{analisis.resumen}</p>
          </CardContent>
        </Card>
      )}

      {/* Map with findings */}
      {territorio && hallazgos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={20} />
              Hallazgos en el mapa
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
      )}

      {/* Findings list */}
      {hallazgos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hallazgos ({hallazgos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hallazgos.map((h) => (
                <div 
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => navigate(createPageUrl('HallazgoDetalle') + `?id=${h.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      h.nivel_riesgo === 'alto' ? 'bg-red-500' :
                      h.nivel_riesgo === 'medio' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium">{h.nombre}</p>
                      <p className="text-sm text-slate-500 capitalize">{h.tipo_cambio?.replace(/_/g, ' ')}</p>
                    </div>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar análisis"
        description="¿Está seguro de eliminar este análisis? Los hallazgos asociados también serán eliminados."
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}