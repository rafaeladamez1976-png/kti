import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Trash2, CheckCircle, FileText, Map, MapPin, Pencil, Save, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageComparer from '@/components/hallazgos/ImageComparer';
import MapView from '@/components/map/MapView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HallazgoDetalle({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const hallazgoId = urlParams.get('id');

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data: hallazgo, isLoading } = useQuery({
    queryKey: ['hallazgo', hallazgoId],
    queryFn: async () => {
      const list = await base44.entities.Hallazgo.filter({ id: hallazgoId });
      return list[0];
    },
    enabled: !!hallazgoId
  });

  const { data: territorio } = useQuery({
    queryKey: ['territorio', hallazgo?.territorio_id],
    queryFn: async () => {
      if (!hallazgo?.territorio_id) return null;
      const list = await base44.entities.Territorio.filter({ id: hallazgo.territorio_id });
      return list[0];
    },
    enabled: !!hallazgo?.territorio_id
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Hallazgo.update(hallazgoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hallazgo', hallazgoId] });
      setEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Hallazgo.delete(hallazgoId),
    onSuccess: () => navigate(createPageUrl('Hallazgos'))
  });

  const handleStartEdit = () => {
    setEditForm({
      nombre: hallazgo.nombre || '',
      tipo_cambio: hallazgo.tipo_cambio || '',
      nivel_riesgo: hallazgo.nivel_riesgo || 'bajo',
      descripcion: hallazgo.descripcion || '',
    });
    setEditing(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleToggleRevisado = () => {
    updateMutation.mutate({ revisado: !hallazgo.revisado });
  };

  const handleToggleInforme = () => {
    updateMutation.mutate({ incluido_en_informe: !hallazgo.incluido_en_informe });
  };

  if (!hallazgoId) {
    navigate(createPageUrl('Hallazgos'));
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!hallazgo) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Hallazgo no encontrado</p>
        <Button onClick={() => navigate(createPageUrl('Hallazgos'))} className="mt-4">
          Volver a hallazgos
        </Button>
      </div>
    );
  }

  const tiposCambioLabels = {
    deforestacion: 'Deforestación',
    construccion: 'Construcción',
    excavacion: 'Excavación',
    invasion: 'Invasión',
    infraestructura: 'Infraestructura',
    otro: 'Otro'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Hallazgos'))}>
          <ArrowLeft size={20} />
        </Button>
        <PageHeader 
          title={hallazgo.nombre}
          description={`${hallazgo.territorio_nombre || 'Sin territorio'} • ${tiposCambioLabels[hallazgo.tipo_cambio] || hallazgo.tipo_cambio || 'Sin clasificar'}`}
          actions={
            <div className="flex gap-2">
              {!editing && (
                <Button variant="outline" onClick={handleStartEdit} className="gap-2">
                  <Pencil size={16} />
                  Editar
                </Button>
              )}
              <Button
                variant={hallazgo.revisado ? "secondary" : "default"}
                onClick={handleToggleRevisado}
                className={`gap-2 ${!hallazgo.revisado ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              >
                <CheckCircle size={16} />
                {hallazgo.revisado ? 'Revisado' : 'Marcar revisado'}
              </Button>
              <Button
                variant={hallazgo.incluido_en_informe ? "secondary" : "outline"}
                onClick={handleToggleInforme}
                className="gap-2"
              >
                <FileText size={16} />
                {hallazgo.incluido_en_informe ? 'En informe' : 'Añadir al informe'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          }
        />
      </div>

      {/* Edit Form */}
      {editing && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Editar hallazgo</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X size={16} className="mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save size={16} className="mr-1" /> Guardar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editForm.nombre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de cambio</Label>
                <Select 
                  value={editForm.tipo_cambio} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, tipo_cambio: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deforestacion">Deforestación</SelectItem>
                    <SelectItem value="construccion">Construcción</SelectItem>
                    <SelectItem value="excavacion">Excavación</SelectItem>
                    <SelectItem value="invasion">Invasión</SelectItem>
                    <SelectItem value="infraestructura">Infraestructura</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nivel de riesgo</Label>
                <Select 
                  value={editForm.nivel_riesgo} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, nivel_riesgo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={editForm.descripcion}
                onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Comparer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Comparación de imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageComparer
                imageA={hallazgo.imagen_a_url}
                imageB={hallazgo.imagen_b_url}
                labelA="Antes"
                labelB="Después"
              />
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clasificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Nivel de riesgo</p>
                <Badge 
                  className={`mt-1 ${
                    hallazgo.nivel_riesgo === 'alto' ? 'bg-red-100 text-red-700' :
                    hallazgo.nivel_riesgo === 'medio' ? 'bg-amber-100 text-amber-700' : 
                    'bg-green-100 text-green-700'
                  }`}
                >
                  {hallazgo.nivel_riesgo?.toUpperCase()}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Tipo de cambio</p>
                <p className="font-medium">{tiposCambioLabels[hallazgo.tipo_cambio] || hallazgo.tipo_cambio || 'Sin clasificar'}</p>
              </div>

              {hallazgo.area_afectada_m2 && (
                <div>
                  <p className="text-sm text-slate-500">Área afectada</p>
                  <p className="font-medium">{hallazgo.area_afectada_m2.toLocaleString()} m²</p>
                </div>
              )}

              {hallazgo.fecha_deteccion && (
                <div>
                  <p className="text-sm text-slate-500">Fecha de detección</p>
                  <p className="font-medium">{format(new Date(hallazgo.fecha_deteccion), 'dd MMMM yyyy', { locale: es })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={18} />
                Coordenadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hallazgo.latitud && hallazgo.longitud ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Latitud</span>
                    <span className="font-mono">{hallazgo.latitud.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Longitud</span>
                    <span className="font-mono">{hallazgo.longitud.toFixed(6)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">Coordenadas no disponibles</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Revisado</span>
                <Badge variant={hallazgo.revisado ? "default" : "secondary"} className={hallazgo.revisado ? "bg-emerald-100 text-emerald-700" : ""}>
                  {hallazgo.revisado ? 'Sí' : 'Pendiente'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">En informe</span>
                <Badge variant={hallazgo.incluido_en_informe ? "default" : "secondary"}>
                  {hallazgo.incluido_en_informe ? 'Sí' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      {(hallazgo.descripcion || hallazgo.descripcion_ia) && (
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hallazgo.descripcion && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Manual</p>
                <p className="text-slate-700">{hallazgo.descripcion}</p>
              </div>
            )}
            {hallazgo.descripcion_ia && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Generada por IA</p>
                <p className="text-slate-600 italic">{hallazgo.descripcion_ia}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location Map */}
      {hallazgo.latitud && hallazgo.longitud && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={18} />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapView
              territorios={territorio ? [territorio] : []}
              hallazgos={[hallazgo]}
              center={[hallazgo.latitud, hallazgo.longitud]}
              zoom={14}
              height="350px"
              showLayers={false}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar hallazgo"
        description={`¿Está seguro de eliminar el hallazgo "${hallazgo.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}