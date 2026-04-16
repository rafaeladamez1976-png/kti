import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Plus, BarChart3, MoreVertical, Eye, Trash2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Analisis({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, analisis: null });
  const [filterTerritorio, setFilterTerritorio] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');

  const { data: analisis = [], isLoading } = useQuery({
    queryKey: ['analisis'],
    queryFn: () => base44.entities.Analisis.list('-created_date', 100)
  });

  const { data: territorios = [] } = useQuery({
    queryKey: ['territorios'],
    queryFn: () => base44.entities.Territorio.list('-created_date', 100)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Analisis.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analisis'] });
      setDeleteDialog({ open: false, analisis: null });
    }
  });

  const filteredAnalisis = analisis.filter(a => {
    if (filterTerritorio !== 'all' && a.territorio_id !== filterTerritorio) return false;
    if (filterEstado !== 'all' && a.estado !== filterEstado) return false;
    return true;
  });

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'procesando':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'completado':
        return <Badge className="bg-emerald-100 text-emerald-700">Completado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'procesando':
        return <Badge className="bg-blue-100 text-blue-700">Procesando</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Análisis"
        description="Historial y gestión de análisis de cambios"
        actions={
          <Button 
            onClick={() => navigate(createPageUrl('EjecutarAnalisis'))} 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus size={18} />
            Nuevo análisis
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-[200px]">
          <Select value={filterTerritorio} onValueChange={setFilterTerritorio}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los territorios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los territorios</SelectItem>
              {territorios.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="procesando">Procesando</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
      ) : filteredAnalisis.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No hay análisis registrados"
          description={filterTerritorio !== 'all' || filterEstado !== 'all' 
            ? "No se encontraron análisis con los filtros seleccionados"
            : "Ejecuta tu primer análisis para detectar cambios en los territorios"
          }
          action={
            <Button 
              onClick={() => navigate(createPageUrl('EjecutarAnalisis'))} 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus size={18} />
              Nuevo análisis
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAnalisis.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(a.estado)}
                    <div>
                      <p className="font-medium">
                        {a.territorio_nombre || 'Territorio desconocido'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {a.fecha_imagen_a && a.fecha_imagen_b 
                          ? `${format(new Date(a.fecha_imagen_a), 'dd/MM/yyyy')} → ${format(new Date(a.fecha_imagen_b), 'dd/MM/yyyy')}`
                          : 'Fechas no definidas'
                        }
                        <span className="mx-2">•</span>
                        <span className="capitalize">{a.tipo}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {a.cambios_detectados !== undefined && a.estado === 'completado' && (
                      <span className="text-sm text-slate-500">{a.cambios_detectados} cambios detectados</span>
                    )}
                    {getStatusBadge(a.estado)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('AnalisisDetalle') + `?id=${a.id}`)}>
                          <Eye size={16} className="mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog({ open: true, analisis: a })}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {a.resumen && (
                  <p className="text-sm text-slate-600 mt-3 pl-8">{a.resumen}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, analisis: null })}
        title="Eliminar análisis"
        description="¿Está seguro de eliminar este análisis? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate(deleteDialog.analisis?.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}