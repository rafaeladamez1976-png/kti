import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Plus, Map, MoreVertical, Pencil, Trash2, Play, Pause, Eye, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DrawingMap from '@/components/map/DrawingMap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Territorios({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, territorio: null });
  const [editingTerritorio, setEditingTerritorio] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    geometria: null,
    frecuencia: 'quincenal',
    tipo_riesgo: '',
    cliente: '',
    activo: true
  });

  const { data: territorios = [], isLoading } = useQuery({
    queryKey: ['territorios'],
    queryFn: () => base44.entities.Territorio.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Territorio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territorios'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Territorio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territorios'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Territorio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territorios'] });
      setDeleteDialog({ open: false, territorio: null });
    }
  });

  const handleOpenCreate = () => {
    setEditingTerritorio(null);
    setFormData({
      nombre: '',
      geometria: null,
      frecuencia: 'quincenal',
      tipo_riesgo: '',
      cliente: '',
      activo: true
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (territorio) => {
    setEditingTerritorio(territorio);
    setFormData({
      nombre: territorio.nombre || '',
      geometria: territorio.geometria || null,
      frecuencia: territorio.frecuencia || 'quincenal',
      tipo_riesgo: territorio.tipo_riesgo || '',
      cliente: territorio.cliente || '',
      activo: territorio.activo !== false
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingTerritorio(null);
    setFormData({
      nombre: '',
      geometria: null,
      frecuencia: 'quincenal',
      tipo_riesgo: '',
      cliente: '',
      activo: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    if (!formData.geometria) {
      alert('Debe dibujar o cargar un área en el mapa');
      return;
    }

    // Calculate center
    let centro_lat = 0, centro_lng = 0;
    if (formData.geometria?.coordinates?.[0]) {
      const coords = formData.geometria.coordinates[0];
      coords.forEach(c => {
        centro_lng += c[0];
        centro_lat += c[1];
      });
      centro_lat /= coords.length;
      centro_lng /= coords.length;
    }

    const dataToSave = {
      ...formData,
      centro_lat,
      centro_lng
    };

    if (editingTerritorio) {
      updateMutation.mutate({ id: editingTerritorio.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleToggleActive = (territorio) => {
    updateMutation.mutate({
      id: territorio.id,
      data: { activo: !territorio.activo }
    });
  };

  const handleExecuteAnalysis = (territorio) => {
    navigate(createPageUrl('EjecutarAnalisis') + `?territorio_id=${territorio.id}`);
  };

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
      <PageHeader 
        title="Territorios"
        description="Gestiona las áreas bajo monitoreo"
        actions={
          <Button onClick={handleOpenCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus size={18} />
            Crear territorio
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : territorios.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No hay territorios registrados"
          description="Crea tu primer territorio para comenzar el monitoreo satelital"
          action={
            <Button onClick={handleOpenCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus size={18} />
              Crear territorio
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {territorios.map((territorio) => (
            <Card key={territorio.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{territorio.nombre}</h3>
                    <p className="text-sm text-slate-500">
                      {frecuenciaLabels[territorio.frecuencia] || territorio.frecuencia}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(createPageUrl('TerritorioDetalle') + `?id=${territorio.id}`)}>
                        <Eye size={16} className="mr-2" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEdit(territorio)}>
                        <Pencil size={16} className="mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExecuteAnalysis(territorio)}>
                        <BarChart3 size={16} className="mr-2" />
                        Ejecutar análisis
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(territorio)}>
                        {territorio.activo ? (
                          <>
                            <Pause size={16} className="mr-2" />
                            Pausar monitoreo
                          </>
                        ) : (
                          <>
                            <Play size={16} className="mr-2" />
                            Activar monitoreo
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteDialog({ open: true, territorio })}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={territorio.activo ? "default" : "secondary"} className={territorio.activo ? "bg-emerald-100 text-emerald-700" : ""}>
                    {territorio.activo ? 'Activo' : 'Pausado'}
                  </Badge>
                  {territorio.tipo_riesgo && (
                    <Badge variant="outline">
                      {tipoRiesgoLabels[territorio.tipo_riesgo] || territorio.tipo_riesgo}
                    </Badge>
                  )}
                </div>

                {territorio.cliente && (
                  <p className="text-xs text-slate-500 mb-2">
                    Cliente: {territorio.cliente}
                  </p>
                )}

                {territorio.ultimo_analisis && (
                  <p className="text-xs text-slate-400">
                    Último análisis: {format(new Date(territorio.ultimo_analisis), 'dd MMM yyyy', { locale: es })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTerritorio ? 'Editar territorio' : 'Crear nuevo territorio'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del territorio"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frecuencia">Frecuencia de monitoreo *</Label>
                <Select 
                  value={formData.frecuencia} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frecuencia: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_riesgo">Tipo de riesgo</Label>
                <Select 
                  value={formData.tipo_riesgo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_riesgo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deforestacion">Deforestación</SelectItem>
                    <SelectItem value="construccion_ilegal">Construcción ilegal</SelectItem>
                    <SelectItem value="mineria">Minería</SelectItem>
                    <SelectItem value="invasion">Invasión</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente asociado</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                  placeholder="Nombre del cliente (opcional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Área del territorio *</Label>
              <p className="text-sm text-slate-500 mb-2">
                Dibuje el polígono en el mapa o cargue un archivo KML/GeoJSON
              </p>
              <DrawingMap
                value={formData.geometria}
                onChange={(geom) => setFormData(prev => ({ ...prev, geometria: geom }))}
                height="350px"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 
                  editingTerritorio ? 'Guardar cambios' : 'Crear territorio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, territorio: null })}
        title="Eliminar territorio"
        description={`¿Está seguro de eliminar el territorio "${deleteDialog.territorio?.nombre}"? Esta acción eliminará también todos los análisis, hallazgos e informes asociados.`}
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate(deleteDialog.territorio?.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}