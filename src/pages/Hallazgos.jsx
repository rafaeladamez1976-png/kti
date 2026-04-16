import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Search, MoreVertical, Eye, Trash2, CheckCircle, FileText, Map as MapIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

export default function Hallazgos({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, hallazgo: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTerritorio, setFilterTerritorio] = useState('all');
  const [filterRiesgo, setFilterRiesgo] = useState('all');
  const [filterRevisado, setFilterRevisado] = useState('all');

  const { data: hallazgos = [], isLoading } = useQuery({
    queryKey: ['hallazgos'],
    queryFn: () => base44.entities.Hallazgo.list('-created_date', 200)
  });

  const { data: territorios = [] } = useQuery({
    queryKey: ['territorios'],
    queryFn: () => base44.entities.Territorio.list('-created_date', 100)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hallazgo.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hallazgos'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Hallazgo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
      setDeleteDialog({ open: false, hallazgo: null });
    }
  });

  const filteredHallazgos = hallazgos.filter(h => {
    if (searchQuery && !h.nombre?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTerritorio !== 'all' && h.territorio_id !== filterTerritorio) return false;
    if (filterRiesgo !== 'all' && h.nivel_riesgo !== filterRiesgo) return false;
    if (filterRevisado === 'revisado' && !h.revisado) return false;
    if (filterRevisado === 'pendiente' && h.revisado) return false;
    return true;
  });

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
      <PageHeader 
        title="Hallazgos"
        description="Gestión de cambios detectados"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Buscar hallazgos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-[180px]">
          <Select value={filterTerritorio} onValueChange={setFilterTerritorio}>
            <SelectTrigger>
              <SelectValue placeholder="Territorio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los territorios</SelectItem>
              {territorios.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[150px]">
          <Select value={filterRiesgo} onValueChange={setFilterRiesgo}>
            <SelectTrigger>
              <SelectValue placeholder="Riesgo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="bajo">Bajo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[150px]">
          <Select value={filterRevisado} onValueChange={setFilterRevisado}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="revisado">Revisados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredHallazgos.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No hay hallazgos"
          description={searchQuery || filterTerritorio !== 'all' || filterRiesgo !== 'all' || filterRevisado !== 'all'
            ? "No se encontraron hallazgos con los filtros seleccionados"
            : "Los hallazgos se generan automáticamente al ejecutar análisis de territorios"
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredHallazgos.map((hallazgo) => (
            <Card key={hallazgo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                      hallazgo.nivel_riesgo === 'alto' ? 'bg-red-500' :
                      hallazgo.nivel_riesgo === 'medio' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <h3 className="font-medium">{hallazgo.nombre}</h3>
                      <p className="text-sm text-slate-500">
                        {hallazgo.territorio_nombre || 'Sin territorio'}
                        {hallazgo.tipo_cambio && (
                          <>
                            <span className="mx-2">•</span>
                            {tiposCambioLabels[hallazgo.tipo_cambio] || hallazgo.tipo_cambio}
                          </>
                        )}
                      </p>
                      {hallazgo.descripcion && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-1">{hallazgo.descripcion}</p>
                      )}
                      {hallazgo.fecha_deteccion && (
                        <p className="text-xs text-slate-400 mt-1">
                          Detectado: {format(new Date(hallazgo.fecha_deteccion), 'dd MMM yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hallazgo.revisado && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} className="mr-1" />
                        Revisado
                      </Badge>
                    )}
                    {hallazgo.incluido_en_informe && (
                      <Badge variant="outline">
                        <FileText size={12} className="mr-1" />
                        En informe
                      </Badge>
                    )}
                    <Badge 
                      className={
                        hallazgo.nivel_riesgo === 'alto' ? 'bg-red-100 text-red-700' :
                        hallazgo.nivel_riesgo === 'medio' ? 'bg-amber-100 text-amber-700' : 
                        'bg-green-100 text-green-700'
                      }
                    >
                      Riesgo {hallazgo.nivel_riesgo}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('HallazgoDetalle') + `?id=${hallazgo.id}`)}>
                          <Eye size={16} className="mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: hallazgo.id, data: { revisado: !hallazgo.revisado } })}>
                          <CheckCircle size={16} className="mr-2" />
                          {hallazgo.revisado ? 'Marcar pendiente' : 'Marcar revisado'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog({ open: true, hallazgo })}
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
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, hallazgo: null })}
        title="Eliminar hallazgo"
        description={`¿Está seguro de eliminar el hallazgo "${deleteDialog.hallazgo?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => deleteMutation.mutate(deleteDialog.hallazgo?.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}