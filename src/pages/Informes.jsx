import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Plus, FileText, MoreVertical, Eye, Trash2, Download, Send, Clock, CheckCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Informes({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, informe: null });
  const [editingInforme, setEditingInforme] = useState(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    territorio_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    resumen: '',
    recomendaciones: '',
    hallazgos_ids: []
  });

  const { data: informes = [], isLoading } = useQuery({
    queryKey: ['informes'],
    queryFn: () => base44.entities.Informe.list('-created_date', 100)
  });

  const { data: territorios = [] } = useQuery({
    queryKey: ['territorios'],
    queryFn: () => base44.entities.Territorio.list('-created_date', 100)
  });

  const { data: hallazgos = [] } = useQuery({
    queryKey: ['hallazgos-para-informe'],
    queryFn: () => base44.entities.Hallazgo.filter({ incluido_en_informe: true }, '-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Informe.create({
      ...data,
      territorio_nombre: territorios.find(t => t.id === data.territorio_id)?.nombre,
      generado_por: user?.email,
      estado: 'borrador'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informes'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Informe.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informes'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Informe.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informes'] });
      setDeleteDialog({ open: false, informe: null });
    }
  });

  const handleOpenCreate = () => {
    setEditingInforme(null);
    setFormData({
      titulo: '',
      territorio_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      resumen: '',
      recomendaciones: '',
      hallazgos_ids: []
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (informe) => {
    setEditingInforme(informe);
    setFormData({
      titulo: informe.titulo || '',
      territorio_id: informe.territorio_id || '',
      fecha_inicio: informe.fecha_inicio || '',
      fecha_fin: informe.fecha_fin || '',
      resumen: informe.resumen || '',
      recomendaciones: informe.recomendaciones || '',
      hallazgos_ids: informe.hallazgos_ids || []
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingInforme(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }

    if (editingInforme) {
      updateMutation.mutate({ id: editingInforme.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChangeEstado = (informe, nuevoEstado) => {
    updateMutation.mutate({ id: informe.id, data: { estado: nuevoEstado } });
  };

  const handleToggleHallazgo = (hallazgoId) => {
    setFormData(prev => ({
      ...prev,
      hallazgos_ids: prev.hallazgos_ids.includes(hallazgoId)
        ? prev.hallazgos_ids.filter(id => id !== hallazgoId)
        : [...prev.hallazgos_ids, hallazgoId]
    }));
  };

  const filteredHallazgos = formData.territorio_id 
    ? hallazgos.filter(h => h.territorio_id === formData.territorio_id)
    : hallazgos;

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'generado':
        return <Badge className="bg-emerald-100 text-emerald-700">Generado</Badge>;
      case 'enviado':
        return <Badge className="bg-blue-100 text-blue-700">Enviado</Badge>;
      default:
        return <Badge variant="secondary">Borrador</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Informes"
        description="Gestión de informes de monitoreo"
        actions={
          <Button onClick={handleOpenCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus size={18} />
            Crear informe
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : informes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay informes registrados"
          description="Crea tu primer informe para documentar los hallazgos detectados"
          action={
            <Button onClick={handleOpenCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus size={18} />
              Crear informe
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {informes.map((informe) => (
            <Card key={informe.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{informe.titulo}</h3>
                    <p className="text-sm text-slate-500">
                      {informe.territorio_nombre || 'Sin territorio'}
                      {informe.fecha_inicio && informe.fecha_fin && (
                        <>
                          <span className="mx-2">•</span>
                          {format(new Date(informe.fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(informe.fecha_fin), 'dd/MM/yyyy')}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Creado: {format(new Date(informe.created_date), 'dd MMM yyyy', { locale: es })}
                      {informe.generado_por && ` por ${informe.generado_por}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {informe.hallazgos_ids?.length > 0 && (
                      <span className="text-sm text-slate-500">{informe.hallazgos_ids.length} hallazgos</span>
                    )}
                    {getEstadoBadge(informe.estado)}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('InformeDetalle') + `?id=${informe.id}`)}>
                          <Eye size={16} className="mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(informe)}>
                          <FileText size={16} className="mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {informe.estado === 'borrador' && (
                          <DropdownMenuItem onClick={() => handleChangeEstado(informe, 'generado')}>
                            <CheckCircle size={16} className="mr-2" />
                            Marcar como generado
                          </DropdownMenuItem>
                        )}
                        {informe.estado === 'generado' && (
                          <DropdownMenuItem onClick={() => handleChangeEstado(informe, 'enviado')}>
                            <Send size={16} className="mr-2" />
                            Marcar como enviado
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog({ open: true, informe })}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {informe.resumen && (
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">{informe.resumen}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInforme ? 'Editar informe' : 'Crear nuevo informe'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Título del informe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="territorio">Territorio</Label>
                <Select 
                  value={formData.territorio_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, territorio_id: value, hallazgos_ids: [] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {territorios.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumen">Resumen</Label>
              <Textarea
                id="resumen"
                value={formData.resumen}
                onChange={(e) => setFormData(prev => ({ ...prev, resumen: e.target.value }))}
                placeholder="Resumen ejecutivo del informe"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recomendaciones">Recomendaciones</Label>
              <Textarea
                id="recomendaciones"
                value={formData.recomendaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
                placeholder="Recomendaciones y acciones sugeridas"
                rows={3}
              />
            </div>

            {/* Hallazgos selection */}
            {filteredHallazgos.length > 0 && (
              <div className="space-y-2">
                <Label>Hallazgos a incluir</Label>
                <div className="border rounded-lg max-h-48 overflow-y-auto p-3 space-y-2">
                  {filteredHallazgos.map(h => (
                    <label key={h.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
                      <Checkbox
                        checked={formData.hallazgos_ids.includes(h.id)}
                        onCheckedChange={() => handleToggleHallazgo(h.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{h.nombre}</p>
                        <p className="text-xs text-slate-500">{h.tipo_cambio?.replace(/_/g, ' ')} • {h.nivel_riesgo}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {filteredHallazgos.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No hay hallazgos marcados para incluir en informe. 
                Marca hallazgos desde la sección de Hallazgos.
              </p>
            )}

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
                  editingInforme ? 'Guardar cambios' : 'Crear informe'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, informe: null })}
        title="Eliminar informe"
        description={`¿Está seguro de eliminar el informe "${deleteDialog.informe?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate(deleteDialog.informe?.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}