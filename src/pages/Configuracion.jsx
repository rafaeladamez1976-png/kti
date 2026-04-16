import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Users, Plus, MoreVertical, Pencil, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Configuracion({ user }) {
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState({ open: false, usuario: null });
  const [editingUser, setEditingUser] = useState(null);
  
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    role: 'user',
    activo: true
  });

  const { data: usuarios = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    enabled: isAdmin
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      handleCloseUserForm();
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setDeleteUserDialog({ open: false, usuario: null });
    }
  });

  const handleOpenEditUser = (usuario) => {
    setEditingUser(usuario);
    setUserFormData({
      full_name: usuario.full_name || '',
      email: usuario.email || '',
      role: usuario.role || 'user',
      activo: usuario.activo !== false
    });
    setUserFormOpen(true);
  };

  const handleCloseUserForm = () => {
    setUserFormOpen(false);
    setEditingUser(null);
    setUserFormData({
      full_name: '',
      email: '',
      role: 'user',
      activo: true
    });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      id: editingUser.id,
      data: {
        full_name: userFormData.full_name,
        role: userFormData.role,
        activo: userFormData.activo
      }
    });
  };

  const handleToggleUserActive = (usuario) => {
    if (usuario.id === user.id) {
      alert('No puede desactivar su propia cuenta');
      return;
    }
    updateUserMutation.mutate({
      id: usuario.id,
      data: { activo: !usuario.activo }
    });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Configuración"
          description="Ajustes del sistema"
        />
        
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tiene permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios y configuración del sistema.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Mi cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Nombre</p>
              <p className="font-medium">{user?.full_name || 'Sin nombre'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Rol</p>
              <Badge variant="secondary" className="capitalize">{user?.role === 'admin' ? 'Administrador' : 'Operador'}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Configuración"
        description="Gestión de usuarios y ajustes del sistema"
      />

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users size={16} />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="mi-cuenta" className="gap-2">
            <Settings size={16} />
            Mi cuenta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Usuarios del sistema</CardTitle>
                <p className="text-sm text-slate-500">
                  Los usuarios deben ser invitados desde el panel de administración de Base44
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : usuarios.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No hay usuarios registrados"
                  description="Invite usuarios desde el panel de administración"
                />
              ) : (
                <div className="space-y-3">
                  {usuarios.map((usuario) => (
                    <div 
                      key={usuario.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        usuario.activo === false ? 'bg-slate-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          usuario.role === 'admin' ? 'bg-emerald-600' : 'bg-slate-500'
                        }`}>
                          {(usuario.full_name || usuario.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{usuario.full_name || 'Sin nombre'}</p>
                            {usuario.id === user.id && (
                              <Badge variant="outline" className="text-xs">Tú</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{usuario.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'} className={usuario.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : ''}>
                          {usuario.role === 'admin' ? 'Administrador' : 'Operador'}
                        </Badge>
                        <Badge variant={usuario.activo !== false ? 'default' : 'secondary'} className={usuario.activo !== false ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                          {usuario.activo !== false ? 'Activo' : 'Inactivo'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditUser(usuario)}>
                              <Pencil size={16} className="mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {usuario.id !== user.id && (
                              <>
                                <DropdownMenuItem onClick={() => handleToggleUserActive(usuario)}>
                                  {usuario.activo !== false ? (
                                    <>
                                      <UserX size={16} className="mr-2" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={16} className="mr-2" />
                                      Activar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeleteUserDialog({ open: true, usuario })}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mi-cuenta" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mi cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Nombre</p>
                <p className="font-medium">{user?.full_name || 'Sin nombre'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Rol</p>
                <Badge className="bg-emerald-100 text-emerald-700">Administrador</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Miembro desde</p>
                <p className="font-medium">
                  {user?.created_date ? format(new Date(user.created_date), 'dd MMMM yyyy', { locale: es }) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={userFormData.full_name}
                onChange={(e) => setUserFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nombre del usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userFormData.email}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-400">El email no se puede modificar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={userFormData.role} 
                onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}
                disabled={editingUser?.id === user.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Operador</SelectItem>
                </SelectContent>
              </Select>
              {editingUser?.id === user.id && (
                <p className="text-xs text-slate-400">No puede cambiar su propio rol</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activo">Usuario activo</Label>
              <Switch
                id="activo"
                checked={userFormData.activo}
                onCheckedChange={(checked) => setUserFormData(prev => ({ ...prev, activo: checked }))}
                disabled={editingUser?.id === user.id}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseUserForm}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <ConfirmDialog
        open={deleteUserDialog.open}
        onOpenChange={(open) => setDeleteUserDialog({ open, usuario: null })}
        title="Eliminar usuario"
        description={`¿Está seguro de eliminar al usuario "${deleteUserDialog.usuario?.full_name || deleteUserDialog.usuario?.email}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => deleteUserMutation.mutate(deleteUserDialog.usuario?.id)}
        loading={deleteUserMutation.isPending}
      />
    </div>
  );
}