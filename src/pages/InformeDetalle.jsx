import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { ArrowLeft, FileText, Map, Trash2, Download, Loader2, CheckCircle, Send, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MapView from '@/components/map/MapView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function InformeDetalle({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const informeId = urlParams.get('id');

  const [deleteDialog, setDeleteDialog] = useState(false);

  const { data: informe, isLoading } = useQuery({
    queryKey: ['informe', informeId],
    queryFn: async () => {
      const list = await base44.entities.Informe.filter({ id: informeId });
      return list[0];
    },
    enabled: !!informeId
  });

  const { data: territorio } = useQuery({
    queryKey: ['territorio', informe?.territorio_id],
    queryFn: async () => {
      if (!informe?.territorio_id) return null;
      const list = await base44.entities.Territorio.filter({ id: informe.territorio_id });
      return list[0];
    },
    enabled: !!informe?.territorio_id
  });

  const { data: hallazgos = [] } = useQuery({
    queryKey: ['hallazgos-informe', informe?.hallazgos_ids],
    queryFn: async () => {
      if (!informe?.hallazgos_ids?.length) return [];
      const allHallazgos = await base44.entities.Hallazgo.list('-created_date', 200);
      return allHallazgos.filter(h => informe.hallazgos_ids.includes(h.id));
    },
    enabled: !!informe?.hallazgos_ids?.length
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Informe.update(informeId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['informe', informeId] })
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Informe.delete(informeId),
    onSuccess: () => navigate(createPageUrl('Informes'))
  });

  if (!informeId) {
    navigate(createPageUrl('Informes'));
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!informe) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Informe no encontrado</p>
        <Button onClick={() => navigate(createPageUrl('Informes'))} className="mt-4">
          Volver a informes
        </Button>
      </div>
    );
  }

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'generado':
        return { icon: CheckCircle, color: 'text-emerald-500', label: 'Generado', badge: 'bg-emerald-100 text-emerald-700' };
      case 'enviado':
        return { icon: Send, color: 'text-blue-500', label: 'Enviado', badge: 'bg-blue-100 text-blue-700' };
      default:
        return { icon: Clock, color: 'text-slate-400', label: 'Borrador', badge: '' };
    }
  };

  const estadoInfo = getEstadoInfo(informe.estado);
  const EstadoIcon = estadoInfo.icon;

  const riesgosAltos = hallazgos.filter(h => h.nivel_riesgo === 'alto').length;
  const riesgosMedios = hallazgos.filter(h => h.nivel_riesgo === 'medio').length;
  const riesgosBajos = hallazgos.filter(h => h.nivel_riesgo === 'bajo').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Informes'))}>
          <ArrowLeft size={20} />
        </Button>
        <PageHeader 
          title={informe.titulo}
          description={informe.territorio_nombre || 'Sin territorio asociado'}
          actions={
            <div className="flex gap-2">
              {informe.estado === 'borrador' && (
                <Button
                  variant="outline"
                  onClick={() => updateMutation.mutate({ estado: 'generado' })}
                  className="gap-2"
                >
                  <CheckCircle size={16} />
                  Marcar generado
                </Button>
              )}
              {informe.estado === 'generado' && (
                <Button
                  variant="outline"
                  onClick={() => updateMutation.mutate({ estado: 'enviado' })}
                  className="gap-2"
                >
                  <Send size={16} />
                  Marcar enviado
                </Button>
              )}
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

      {/* Preview Card - simulates PDF */}
      <Card className="bg-white">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center border-b pb-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                K
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{informe.titulo}</h1>
            <p className="text-slate-500 mt-2">{informe.territorio_nombre || 'Informe General'}</p>
            {informe.fecha_inicio && informe.fecha_fin && (
              <p className="text-sm text-slate-400 mt-1">
                Período: {format(new Date(informe.fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(informe.fecha_fin), 'dd/MM/yyyy')}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex justify-between items-center mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <EstadoIcon className={estadoInfo.color} size={20} />
              <span className="font-medium">Estado:</span>
              <Badge className={estadoInfo.badge}>{estadoInfo.label}</Badge>
            </div>
            <div className="text-sm text-slate-500">
              Generado: {format(new Date(informe.created_date), 'dd MMMM yyyy', { locale: es })}
              {informe.generado_por && ` por ${informe.generado_por}`}
            </div>
          </div>

          {/* Summary */}
          {informe.resumen && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Resumen Ejecutivo</h2>
              <p className="text-slate-600">{informe.resumen}</p>
            </div>
          )}

          {/* Stats */}
          {hallazgos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Estadísticas</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">{hallazgos.length}</p>
                  <p className="text-sm text-slate-500">Hallazgos</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{riesgosAltos}</p>
                  <p className="text-sm text-slate-500">Riesgo alto</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{riesgosMedios}</p>
                  <p className="text-sm text-slate-500">Riesgo medio</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{riesgosBajos}</p>
                  <p className="text-sm text-slate-500">Riesgo bajo</p>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          {territorio && hallazgos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Mapa General</h2>
              <MapView
                territorios={[territorio]}
                hallazgos={hallazgos}
                center={territorio.centro_lat && territorio.centro_lng ? [territorio.centro_lat, territorio.centro_lng] : undefined}
                zoom={11}
                height="350px"
                showLayers={false}
              />
            </div>
          )}

          {/* Findings List */}
          {hallazgos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Detalle de Hallazgos</h2>
              <div className="space-y-4">
                {hallazgos.map((h, index) => (
                  <div key={h.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm text-slate-400">#{index + 1}</span>
                        <h3 className="font-medium">{h.nombre}</h3>
                      </div>
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
                    <p className="text-sm text-slate-500 mb-2">
                      Tipo: {h.tipo_cambio?.replace(/_/g, ' ')}
                      {h.latitud && h.longitud && (
                        <> • Coords: {h.latitud.toFixed(4)}, {h.longitud.toFixed(4)}</>
                      )}
                    </p>
                    {(h.descripcion || h.descripcion_ia) && (
                      <p className="text-sm text-slate-600">{h.descripcion || h.descripcion_ia}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {informe.recomendaciones && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Recomendaciones</h2>
              <p className="text-slate-600">{informe.recomendaciones}</p>
            </div>
          )}

          {/* Coordinates Annex */}
          {hallazgos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Anexo: Coordenadas</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">#</th>
                      <th className="text-left py-2 px-3">Hallazgo</th>
                      <th className="text-left py-2 px-3">Latitud</th>
                      <th className="text-left py-2 px-3">Longitud</th>
                      <th className="text-left py-2 px-3">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallazgos.map((h, index) => (
                      <tr key={h.id} className="border-b">
                        <td className="py-2 px-3">{index + 1}</td>
                        <td className="py-2 px-3">{h.nombre}</td>
                        <td className="py-2 px-3 font-mono">{h.latitud?.toFixed(6) || '-'}</td>
                        <td className="py-2 px-3 font-mono">{h.longitud?.toFixed(6) || '-'}</td>
                        <td className="py-2 px-3 capitalize">{h.nivel_riesgo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar informe"
        description={`¿Está seguro de eliminar el informe "${informe.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}