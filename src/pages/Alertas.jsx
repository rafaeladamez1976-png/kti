import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Bell, MoreVertical, Eye, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Alertas({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, alerta: null });
  const [resolveDialog, setResolveDialog] = useState({ open: false, alerta: null });
  const [notasResolucion, setNotasResolucion] = useState('');
  const [activeTab, setActiveTab] = useState('activas');

  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => base44.entities.Alerta.list('-created_date', 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alerta.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      setResolveDialog({ open: false, alerta: null });
      setNotasResolucion('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Alerta.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      setDeleteDialog({ open: false, alerta: null });
    }
  });

  const alertasActivas = alertas.filter(a => a.estado === 'activa');
  const alertasResueltas = alertas.filter(a => a.estado === 'resuelta');
  const alertasDescartadas = alertas.filter(a => a.estado === 'descartada');

  const handleResolve = () => {
    updateMutation.mutate({
      id: resolveDialog.alerta.id,
      data: {
        estado: 'resuelta',
        fecha_resolucion: new Date().toISOString().split('T')[0],
        notas_resolucion: notasResolucion
      }
    });
  };

  const handleDiscard = (alerta) => {
    updateMutation.mutate({
      id: alerta.id,
      data: { estado: 'descartada' }
    });
  };

  const handleReactivate = (alerta) => {
    updateMutation.mutate({
      id: alerta.id,
      data: { 
        estado: 'activa',
        fecha_resolucion: null,
        notas_resolucion: null
      }
    });
  };

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'alto':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'medio':
        return <AlertTriangle className="text-amber-500" size={20} />;
      default:
        return <Bell className="text-green-500" size={20} />;
    }
  };

  const getNivelBadge = (nivel) => {
    switch (nivel) {
      case 'alto':
        return <Badge className="bg-red-100 text-red-700">Alto</Badge>;
      case 'medio':
        return <Badge className="bg-amber-100 text-amber-700">Medio</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700">Bajo</Badge>;
    }
  };

  const renderAlertasList = (alertasList, showActions = true) => {
    if (alertasList.length === 0) {
      return (
        <EmptyState
          icon={Bell}
          title="No hay alertas"
          description="Las alertas se generan automáticamente cuando se detectan cambios de alto riesgo"
        />
      );
    }

    return (
      <div className="space-y-3">
        {alertasList.map((alerta) => (
          <Card key={alerta.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {getNivelIcon(alerta.nivel)}
                  <div>
                    <h3 className="font-medium">{alerta.titulo}</h3>
                    <p className="text-sm text-slate-500">
                      {alerta.territorio_nombre || 'Sin territorio'}
                    </p>
                    {alerta.descripcion && (
                      <p className="text-sm text-slate-400 mt-1">{alerta.descripcion}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Creada: {format(new Date(alerta.created_date), 'dd MMM yyyy, HH:mm', { locale: es })}
                      {alerta.fecha_resolucion && (
                        <> • Resuelta: {format(new Date(alerta.fecha_resolucion), 'dd MMM yyyy', { locale: es })}</>
                      )}
                    </p>
                    {alerta.notas_resolucion && (
                      <p className="text-sm text-slate-500 mt-2 italic">
                        "{alerta.notas_resolucion}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getNivelBadge(alerta.nivel)}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {alerta.hallazgo_id && (
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('HallazgoDetalle') + `?id=${alerta.hallazgo_id}`)}>
                          <Eye size={16} className="mr-2" />
                          Ver hallazgo
                        </DropdownMenuItem>
                      )}
                      {showActions && alerta.estado === 'activa' && (
                        <>
                          <DropdownMenuItem onClick={() => setResolveDialog({ open: true, alerta })}>
                            <CheckCircle size={16} className="mr-2" />
                            Marcar resuelta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDiscard(alerta)}>
                            <XCircle size={16} className="mr-2" />
                            Descartar
                          </DropdownMenuItem>
                        </>
                      )}
                      {(alerta.estado === 'resuelta' || alerta.estado === 'descartada') && (
                        <DropdownMenuItem onClick={() => handleReactivate(alerta)}>
                          <Bell size={16} className="mr-2" />
                          Reactivar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteDialog({ open: true, alerta })}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Alertas"
        description="Gestión de alertas del sistema"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`cursor-pointer transition-all ${activeTab === 'activas' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setActiveTab('activas')}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{alertasActivas.length}</p>
            <p className="text-sm text-slate-500">Activas</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === 'resueltas' ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setActiveTab('resueltas')}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{alertasResueltas.length}</p>
            <p className="text-sm text-slate-500">Resueltas</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === 'descartadas' ? 'ring-2 ring-slate-500' : ''}`} onClick={() => setActiveTab('descartadas')}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-600">{alertasDescartadas.length}</p>
            <p className="text-sm text-slate-500">Descartadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="activas" className="gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Activas ({alertasActivas.length})
          </TabsTrigger>
          <TabsTrigger value="resueltas" className="gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Resueltas ({alertasResueltas.length})
          </TabsTrigger>
          <TabsTrigger value="descartadas" className="gap-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
            Descartadas ({alertasDescartadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activas" className="mt-4">
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
          ) : (
            renderAlertasList(alertasActivas)
          )}
        </TabsContent>

        <TabsContent value="resueltas" className="mt-4">
          {renderAlertasList(alertasResueltas, false)}
        </TabsContent>

        <TabsContent value="descartadas" className="mt-4">
          {renderAlertasList(alertasDescartadas, false)}
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ open, alerta: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver alerta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              ¿Está seguro de marcar como resuelta la alerta "{resolveDialog.alerta?.titulo}"?
            </p>
            <div className="space-y-2">
              <Label>Notas de resolución (opcional)</Label>
              <Textarea
                value={notasResolucion}
                onChange={(e) => setNotasResolucion(e.target.value)}
                placeholder="Describe las acciones tomadas..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog({ open: false, alerta: null })}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResolve} 
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Marcar resuelta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, alerta: null })}
        title="Eliminar alerta"
        description={`¿Está seguro de eliminar la alerta "${deleteDialog.alerta?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate(deleteDialog.alerta?.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}